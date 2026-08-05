import SwiftUI
import WebKit
import AVFoundation
import Vision

struct ContentView: View {
    @State private var showScanner = false
    @State private var webViewRef: WKWebView?

    var body: some View {
        WebView(
            url: URL(string: "https://jack108510.github.io/tariff-buddy/?v=\(Int(Date().timeIntervalSince1970))")!,
            onScanRequested: { showScanner = true },
            onWebViewReady: { webView in webViewRef = webView }
        )
        .ignoresSafeArea(edges: .bottom)
        .sheet(isPresented: $showScanner) {
            BarcodeScannerView(
                onBarcodeDetected: { barcode in
                    showScanner = false
                    // Pass the barcode to the web view's lookup engine
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                        webViewRef?.evaluateJavaScript(
                            "window.tariffBuddyHandleBarcode && window.tariffBuddyHandleBarcode('\(barcode)')",
                            completionHandler: nil
                        )
                    }
                },
                onClose: { showScanner = false }
            )
        }
    }
}

// MARK: - WebView

struct WebView: UIViewRepresentable {
    let url: URL
    var onScanRequested: () -> Void
    var onWebViewReady: (WKWebView) -> Void

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        // Use default data store but clear it on launch so we always get fresh content
        config.websiteDataStore = WKWebsiteDataStore.default()

        // Register message handler so JS can trigger native scanning
        config.userContentController.add(context.coordinator, name: "scanNative")

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        context.coordinator.onScanRequested = onScanRequested

        // Clear all cached web data before loading
        WKWebsiteDataStore.default().removeData(ofTypes: WKWebsiteDataStore.allWebsiteDataTypes(),
                                                   modifiedSince: Date(timeIntervalSince1970: 0)) {
            let request = URLRequest(url: url, cachePolicy: .reloadIgnoringLocalAndRemoteCacheData, timeoutInterval: 10)
            webView.load(request)
        }
        onWebViewReady(webView)
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    func makeCoordinator() -> Coordinator { Coordinator() }

    class Coordinator: NSObject, WKNavigationDelegate, WKScriptMessageHandler {
        var onScanRequested: (() -> Void)?

        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            if message.name == "scanNative" {
                DispatchQueue.main.async { self.onScanRequested?() }
            }
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            // Inject JS bridge:
            // 1. Override the "start-camera" button to call native instead of web camera
            // 2. Add handler function that native Swift calls with the barcode
            let bridge = """
            (function() {
                // Intercept all clicks — if target is the "Start camera scan" button, use native
                document.addEventListener('click', function(e) {
                    var el = e.target;
                    while (el && el !== document) {
                        if (el.dataset && el.dataset.action === 'start-camera') {
                            e.preventDefault();
                            e.stopPropagation();
                            if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.scanNative) {
                                window.webkit.messageHandlers.scanNative.postMessage('start');
                            }
                            return false;
                        }
                        el = el.parentElement;
                    }
                }, true);

                // Handler that native Swift calls after a barcode is detected
                window.tariffBuddyHandleBarcode = function(barcode) {
                    if (typeof state === 'undefined') return;
                    if (typeof ProductLookup === 'undefined') return;

                    state.scanning = true;
                    state.scanFound = false;
                    state.lastLookupError = null;
                    state.screen = 'scanner';
                    render();

                    ProductLookup.lookup(barcode).then(function(result) {
                        state.scanResult = result;
                        state.scanFound = true;
                        state.screen = 'result';
                        render();
                        addToHistory(result);
                    });
                };

                console.log('Tariff Buddy native bridge ready');
            })();
            """
            webView.evaluateJavaScript(bridge, completionHandler: nil)
        }
    }
}

// MARK: - Native Barcode Scanner

struct BarcodeScannerView: UIViewControllerRepresentable {
    let onBarcodeDetected: (String) -> Void
    let onClose: () -> Void

    func makeUIViewController(context: Context) -> ScannerViewController {
        let vc = ScannerViewController()
        vc.onBarcodeDetected = { barcode in onBarcodeDetected(barcode) }
        vc.onClose = { onClose() }
        return vc
    }

    func updateUIViewController(_ uiViewController: ScannerViewController, context: Context) {}
}

class ScannerViewController: UIViewController, AVCaptureVideoDataOutputSampleBufferDelegate {
    var onBarcodeDetected: ((String) -> Void)?
    var onClose: (() -> Void)?

    private let captureSession = AVCaptureSession()
    private var previewLayer: AVCaptureVideoPreviewLayer?
    private var hasDetected = false

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .black
        setupCamera()
        setupOverlay()
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        previewLayer?.frame = view.bounds
    }

    private func setupCamera() {
        guard let camera = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back) else {
            showError("No camera available")
            return
        }

        do {
            let input = try AVCaptureDeviceInput(device: camera)
            if captureSession.canAddInput(input) { captureSession.addInput(input) }
        } catch {
            showError("Camera setup failed")
            return
        }

        let output = AVCaptureVideoDataOutput()
        output.videoSettings = [
            kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA
        ]
        output.alwaysDiscardsLateVideoFrames = true
        output.setSampleBufferDelegate(self, queue: DispatchQueue(label: "tariffbuddy.scanner", qos: .userInitiated))
        if captureSession.canAddOutput(output) { captureSession.addOutput(output) }

        let preview = AVCaptureVideoPreviewLayer(session: captureSession)
        preview.frame = view.bounds
        preview.videoGravity = .resizeAspectFill
        view.layer.addSublayer(preview)
        previewLayer = preview

        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            self?.captureSession.startRunning()
        }
    }

    private func setupOverlay() {
        // Targeting box
        let targetBox = UIView()
        targetBox.layer.borderColor = UIColor.systemGreen.cgColor
        targetBox.layer.borderWidth = 3
        targetBox.layer.cornerRadius = 16
        targetBox.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(targetBox)

        NSLayoutConstraint.activate([
            targetBox.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            targetBox.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            targetBox.widthAnchor.constraint(equalTo: view.widthAnchor, multiplier: 0.75),
            targetBox.heightAnchor.constraint(equalTo: targetBox.widthAnchor, multiplier: 0.5),
        ])

        // Instruction label
        let label = UILabel()
        label.text = "Point at a barcode"
        label.textColor = .white
        label.font = .systemFont(ofSize: 18, weight: .semibold)
        label.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(label)

        NSLayoutConstraint.activate([
            label.topAnchor.constraint(equalTo: targetBox.bottomAnchor, constant: 30),
            label.centerXAnchor.constraint(equalTo: view.centerXAnchor),
        ])

        // Close button
        let closeBtn = UIButton(type: .system)
        closeBtn.setTitle("Cancel", for: .normal)
        closeBtn.setTitleColor(.white, for: .normal)
        closeBtn.titleLabel?.font = .systemFont(ofSize: 16, weight: .medium)
        closeBtn.translatesAutoresizingMaskIntoConstraints = false
        closeBtn.addTarget(self, action: #selector(closeTapped), for: .touchUpInside)
        view.addSubview(closeBtn)

        NSLayoutConstraint.activate([
            closeBtn.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 16),
            closeBtn.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20),
        ])
    }

    @objc private func closeTapped() {
        captureSession.stopRunning()
        onClose?()
    }

    private func showError(_ message: String) {
        DispatchQueue.main.async { [weak self] in
            let label = UILabel()
            label.text = message
            label.textColor = .white
            label.textAlignment = .center
            label.translatesAutoresizingMaskIntoConstraints = false
            self?.view.addSubview(label)
            if let view = self?.view {
                NSLayoutConstraint.activate([
                    label.centerXAnchor.constraint(equalTo: view.centerXAnchor),
                    label.centerYAnchor.constraint(equalTo: view.centerYAnchor),
                ])
            }
        }
    }

    func captureOutput(_ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer, from connection: AVCaptureConnection) {
        guard !hasDetected,
              let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else { return }

        let request = VNDetectBarcodesRequest { [weak self] request, _ in
            guard let results = request.results as? [VNBarcodeObservation] else { return }
            for obs in results {
                if let payload = obs.payloadStringValue, !payload.isEmpty {
                    self?.hasDetected = true
                    DispatchQueue.main.async {
                        self?.captureSession.stopRunning()
                        // Haptic feedback
                        let generator = UINotificationFeedbackGenerator()
                        generator.notificationOccurred(.success)
                        self?.onBarcodeDetected?(payload)
                    }
                    return
                }
            }
        }

        let handler = VNImageRequestHandler(cvPixelBuffer: pixelBuffer, orientation: .up)
        DispatchQueue.global(qos: .userInitiated).async {
            try? handler.perform([request])
        }
    }

    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        if captureSession.isRunning { captureSession.stopRunning() }
    }
}

#Preview {
    ContentView()
}

import SwiftUI
import WebKit

struct ContentView: View {
    var body: some View {
        WebView(url: URL(string: "https://jack108510.github.io/tariff-buddy/")!)
            .ignoresSafeArea(edges: .bottom)
    }
}

struct WebView: UIViewRepresentable {
    let url: URL
    
    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        
        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        
        // Set custom user agent to identify as the iOS app
        webView.customUserAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 TariffBuddy/1.0"
        
        let request = URLRequest(url: url)
        webView.load(request)
        
        return webView
    }
    
    func updateUIView(_ uiView: WKWebView, context: Context) {}
    
    func makeCoordinator() -> Coordinator { Coordinator() }
    
    class Coordinator: NSObject, WKNavigationDelegate {
        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            // Inject any iOS-specific adjustments
            let js = """
            document.documentElement.style.setProperty('-webkit-user-select', 'none');
            document.documentElement.style.webkitTouchCallout = 'none';
            """
            webView.evaluateJavaScript(js, completionHandler: nil)
        }
    }
}

#Preview {
    ContentView()
}

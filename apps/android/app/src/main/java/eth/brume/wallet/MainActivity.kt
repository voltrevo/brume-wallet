package eth.brume.wallet

import android.os.Bundle
import android.webkit.ServiceWorkerClient
import android.webkit.ServiceWorkerController
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import com.getcapacitor.BridgeActivity

class MainActivity: BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        ServiceWorkerController.getInstance().setServiceWorkerClient(object: ServiceWorkerClient() {
            override fun shouldInterceptRequest(request: WebResourceRequest): WebResourceResponse? {
                return bridge.localServer.shouldInterceptRequest(request)
            }
        })
    }
}

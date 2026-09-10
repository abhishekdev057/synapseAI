package com.sigmafusion.synapse

import android.Manifest
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import com.sigmafusion.synapse.ui.SynapseNavHost
import com.sigmafusion.synapse.ui.theme.SynapseTheme

class MainActivity : ComponentActivity() {

    private val notificationPermission =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { }

    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            notificationPermission.launch(Manifest.permission.POST_NOTIFICATIONS)
        }

        val startRoute = intent.getStringExtra(EXTRA_START_ROUTE)

        setContent {
            SynapseTheme {
                SynapseNavHost(startRoute = startRoute)
            }
        }
    }

    companion object {
        const val EXTRA_START_ROUTE = "start_route"
    }
}

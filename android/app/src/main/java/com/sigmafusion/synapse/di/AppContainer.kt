package com.sigmafusion.synapse.di

import android.content.Context
import com.sigmafusion.synapse.BuildConfig
import com.sigmafusion.synapse.data.SynapseRepository
import com.sigmafusion.synapse.data.local.SettingsStore
import com.sigmafusion.synapse.data.local.SynapseDatabase
import com.sigmafusion.synapse.data.remote.ApiProvider

/** Hand-rolled DI graph. One instance, created in [com.sigmafusion.synapse.SynapseApp]. */
class AppContainer(context: Context) {
    private val appContext = context.applicationContext

    val settings: SettingsStore by lazy { SettingsStore(appContext) }
    private val database: SynapseDatabase by lazy { SynapseDatabase.build(appContext) }
    val apiProvider: ApiProvider by lazy { ApiProvider(BuildConfig.DEFAULT_BASE_URL) }

    val repository: SynapseRepository by lazy {
        SynapseRepository(appContext, database, apiProvider, settings)
    }
}

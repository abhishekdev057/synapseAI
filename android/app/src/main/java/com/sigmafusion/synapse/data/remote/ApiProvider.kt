package com.sigmafusion.synapse.data.remote

import com.jakewharton.retrofit2.converter.kotlinx.serialization.asConverterFactory
import com.sigmafusion.synapse.BuildConfig
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import java.util.concurrent.TimeUnit

/**
 * Holds the current [SynapseApi]. The base URL is user-overridable in Settings,
 * so the client can be rebuilt at runtime without restarting the app.
 */
class ApiProvider(initialBaseUrl: String) {

    private val json = Json {
        ignoreUnknownKeys = true
        explicitNulls = false
        isLenient = true
    }

    private val client: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(20, TimeUnit.SECONDS)
        .apply {
            if (BuildConfig.DEBUG) {
                addInterceptor(
                    HttpLoggingInterceptor().apply {
                        level = HttpLoggingInterceptor.Level.BASIC
                    },
                )
            }
        }
        .build()

    @Volatile
    var api: SynapseApi = build(initialBaseUrl)
        private set

    @Volatile
    var baseUrl: String = initialBaseUrl
        private set

    fun rebuild(baseUrl: String) {
        val normalised = if (baseUrl.endsWith("/")) baseUrl else "$baseUrl/"
        if (normalised == this.baseUrl) return
        this.baseUrl = normalised
        api = build(normalised)
    }

    private fun build(baseUrl: String): SynapseApi =
        Retrofit.Builder()
            .baseUrl(baseUrl)
            .client(client)
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()
            .create(SynapseApi::class.java)
}

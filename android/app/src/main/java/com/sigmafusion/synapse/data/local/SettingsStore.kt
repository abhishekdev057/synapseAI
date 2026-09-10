package com.sigmafusion.synapse.data.local

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.sigmafusion.synapse.BuildConfig
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "synapse_settings")

/** Small key-value settings: which patient, the sync server, language, TTS. */
class SettingsStore(private val context: Context) {

    private object Keys {
        val PATIENT_ID = stringPreferencesKey("patient_id")
        val PATIENT_NAME = stringPreferencesKey("patient_name")
        val BASE_URL = stringPreferencesKey("base_url")
        val LANGUAGE = stringPreferencesKey("language")
        val TTS_ENABLED = booleanPreferencesKey("tts_enabled")
        val LAST_SYNC = longPreferencesKey("last_sync_epoch")
    }

    val patientId: Flow<String?> = context.dataStore.data.map { it[Keys.PATIENT_ID] }
    val patientName: Flow<String?> = context.dataStore.data.map { it[Keys.PATIENT_NAME] }
    val baseUrl: Flow<String> = context.dataStore.data.map {
        it[Keys.BASE_URL] ?: BuildConfig.DEFAULT_BASE_URL
    }
    val language: Flow<String> = context.dataStore.data.map { it[Keys.LANGUAGE] ?: "as" }
    val ttsEnabled: Flow<Boolean> = context.dataStore.data.map { it[Keys.TTS_ENABLED] ?: true }
    val lastSync: Flow<Long> = context.dataStore.data.map { it[Keys.LAST_SYNC] ?: 0L }

    suspend fun setPatient(id: String, name: String) = context.dataStore.edit {
        it[Keys.PATIENT_ID] = id
        it[Keys.PATIENT_NAME] = name
    }

    suspend fun setBaseUrl(url: String) = context.dataStore.edit {
        it[Keys.BASE_URL] = if (url.endsWith("/")) url else "$url/"
    }

    suspend fun setLanguage(code: String) = context.dataStore.edit { it[Keys.LANGUAGE] = code }

    suspend fun setTtsEnabled(enabled: Boolean) = context.dataStore.edit {
        it[Keys.TTS_ENABLED] = enabled
    }

    suspend fun setLastSync(epoch: Long) = context.dataStore.edit { it[Keys.LAST_SYNC] = epoch }
}

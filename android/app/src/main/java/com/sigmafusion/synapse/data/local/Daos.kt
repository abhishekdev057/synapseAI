package com.sigmafusion.synapse.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface PatientDao {
    @Query("SELECT * FROM patient WHERE id = :id")
    fun observe(id: String): Flow<PatientEntity?>

    @Query("SELECT * FROM patient WHERE id = :id")
    suspend fun get(id: String): PatientEntity?

    @Query("SELECT COUNT(*) FROM patient")
    suspend fun count(): Int

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(patient: PatientEntity)
}

@Dao
interface ReminderDao {
    @Query("SELECT * FROM reminder WHERE patientId = :patientId AND active = 1")
    fun observeActive(patientId: String): Flow<List<ReminderEntity>>

    @Query("SELECT * FROM reminder WHERE patientId = :patientId")
    suspend fun getAll(patientId: String): List<ReminderEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertAll(reminders: List<ReminderEntity>)

    @Query("DELETE FROM reminder WHERE patientId = :patientId")
    suspend fun clearFor(patientId: String)
}

@Dao
interface ReminderLogDao {
    @Query("SELECT * FROM reminder_log WHERE patientId = :patientId AND scheduledForEpoch >= :fromEpoch")
    fun observeSince(patientId: String, fromEpoch: Long): Flow<List<ReminderLogEntity>>

    @Query("SELECT * FROM reminder_log WHERE synced = 0")
    suspend fun unsynced(): List<ReminderLogEntity>

    @Query("SELECT * FROM reminder_log WHERE reminderId = :reminderId AND scheduledForEpoch = :scheduledForEpoch LIMIT 1")
    suspend fun find(reminderId: String, scheduledForEpoch: Long): ReminderLogEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(log: ReminderLogEntity)

    @Query("UPDATE reminder_log SET synced = 1, remoteId = :remoteId WHERE localId = :localId")
    suspend fun markSynced(localId: String, remoteId: String?)
}

@Dao
interface GameSessionDao {
    @Query("SELECT * FROM game_session WHERE patientId = :patientId AND gameKey = :gameKey ORDER BY playedAtEpoch DESC LIMIT :limit")
    suspend fun recentForGame(patientId: String, gameKey: String, limit: Int): List<GameSessionEntity>

    @Query("SELECT COUNT(*) FROM game_session WHERE patientId = :patientId AND playedAtEpoch >= :fromEpoch")
    fun countSince(patientId: String, fromEpoch: Long): Flow<Int>

    @Query("SELECT * FROM game_session WHERE synced = 0")
    suspend fun unsynced(): List<GameSessionEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(session: GameSessionEntity)

    @Query("UPDATE game_session SET synced = 1, remoteId = :remoteId WHERE localId = :localId")
    suspend fun markSynced(localId: String, remoteId: String?)
}

@Dao
interface ContactDao {
    @Query("SELECT * FROM family_contact WHERE patientId = :patientId ORDER BY name")
    fun observe(patientId: String): Flow<List<FamilyContactEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertAll(contacts: List<FamilyContactEntity>)

    @Query("DELETE FROM family_contact WHERE patientId = :patientId")
    suspend fun clearFor(patientId: String)
}

package com.sigmafusion.synapse.data.remote

import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

interface SynapseApi {

    @GET("api/patients")
    suspend fun getPatients(): PatientListResponse

    @GET("api/patients/{id}")
    suspend fun getPatient(@Path("id") id: String): PatientEnvelope

    @GET("api/patients/{id}/reminders")
    suspend fun getReminders(@Path("id") id: String): RemindersResponse

    @GET("api/patients/{id}/reminders/today")
    suspend fun getTodayReminders(@Path("id") id: String): TodayResponse

    @GET("api/patients/{id}/contacts")
    suspend fun getContacts(@Path("id") id: String): ContactsResponse

    @GET("api/patients/{id}/next-difficulty")
    suspend fun getNextDifficulty(
        @Path("id") id: String,
        @Query("game") game: String,
    ): NextDifficultyDto

    @POST("api/patients/{id}/sessions")
    suspend fun postSession(
        @Path("id") id: String,
        @Body body: SessionCreateDto,
    ): SessionCreateResponse

    @POST("api/reminders/{id}/log")
    suspend fun postReminderLog(
        @Path("id") reminderId: String,
        @Body body: ReminderLogCreateDto,
    ): ReminderLogResponse
}

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.kotlin.serialization)
    alias(libs.plugins.ksp)
}

android {
    namespace = "com.sigmafusion.synapse"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.sigmafusion.synapse"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "0.1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

        // Server used for delta sync. Overridable at runtime in Settings.
        buildConfigField("String", "DEFAULT_BASE_URL", "\"https://synapse.sigmafusion.in/\"")
        // Fallback patient for the demo until sign-in exists.
        buildConfigField("String", "DEMO_PATIENT_NAME", "\"Aideu Handique\"")
    }

    buildTypes {
        debug {
            applicationIdSuffix = ".debug"
            isDebuggable = true
        }
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro",
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
        buildConfig = true
    }
    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

/*
 * After every debug build, drop the APK into the Next.js app's public/ folder so
 * it is downloadable from the website (patient view → "Get the Android app").
 */
val webDownloadsDir = rootProject.layout.projectDirectory.dir("../public/downloads")

tasks.register("attachApkToWeb") {
    description = "Copies app-debug.apk into ../public/downloads for the website."
    doLast {
        val apk = layout.buildDirectory
            .file("outputs/apk/debug/app-debug.apk").get().asFile
        if (!apk.exists()) {
            println("attachApkToWeb: no APK at ${apk.path}, skipping")
            return@doLast
        }
        val outDir = webDownloadsDir.asFile.apply { mkdirs() }
        val dest = outDir.resolve("synapse-patient.apk")
        apk.copyTo(dest, overwrite = true)
        outDir.resolve("apk-info.json").writeText(
            """
            {
              "sizeBytes": ${dest.length()},
              "builtAt": ${System.currentTimeMillis()},
              "versionName": "${android.defaultConfig.versionName}"
            }
            """.trimIndent(),
        )
        println("attachApkToWeb: ${dest.relativeTo(rootProject.rootDir)} (${dest.length() / 1_048_576} MB)")
    }
}

tasks.matching { it.name == "assembleDebug" }.configureEach {
    finalizedBy("attachApkToWeb")
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.core.splashscreen)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.lifecycle.runtime.compose)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.activity.compose)

    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.ui)
    implementation(libs.androidx.ui.graphics)
    implementation(libs.androidx.ui.tooling.preview)
    implementation(libs.androidx.material3)
    implementation(libs.androidx.material.icons.extended)
    implementation(libs.androidx.navigation.compose)
    debugImplementation(libs.androidx.ui.tooling)

    implementation(libs.androidx.room.runtime)
    implementation(libs.androidx.room.ktx)
    ksp(libs.androidx.room.compiler)

    implementation(libs.androidx.work.runtime.ktx)
    implementation(libs.androidx.datastore.preferences)

    implementation(libs.retrofit)
    implementation(libs.retrofit.kotlinx.serialization)
    implementation(libs.okhttp.logging)
    implementation(libs.kotlinx.serialization.json)
    implementation(libs.kotlinx.coroutines.android)

    implementation(libs.coil.compose)
}

package expo.modules.sophiabubble

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.core.content.ContextCompat
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File

/** Bridge for the optional floating Sophia's Test search bubble. Nothing runs until start() is called. */
class SophiaBubbleModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("SophiaBubble")

    Function("canDrawOverlays") {
      Build.VERSION.SDK_INT < Build.VERSION_CODES.M || Settings.canDrawOverlays(context)
    }

    Function("openOverlaySettings") {
      val intent = Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:${context.packageName}"))
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(intent)
    }

    Function("isRunning") {
      SophiaBubbleService.running
    }

    /** Saves the question list for the bubble and starts it. The JSON is [{"q","a","k"}]. */
    Function("start") { questionsJson: String ->
      File(context.filesDir, SophiaBubbleService.DATA_FILE).writeText(questionsJson)
      val intent = Intent(context, SophiaBubbleService::class.java).setAction(SophiaBubbleService.ACTION_START)
      ContextCompat.startForegroundService(context, intent)
    }

    Function("stop") {
      context.stopService(Intent(context, SophiaBubbleService::class.java))
    }
  }
}

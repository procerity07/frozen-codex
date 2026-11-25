package expo.modules.mltranslate

import com.google.mlkit.common.model.DownloadConditions
import com.google.mlkit.nl.translate.TranslateLanguage
import com.google.mlkit.nl.translate.Translation
import com.google.mlkit.nl.translate.Translator
import com.google.mlkit.nl.translate.TranslatorOptions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.Locale

/** English -> phone language, fully on the device. The language model (~30 MB) downloads once. */
class MlTranslateModule : Module() {
  private val clients = HashMap<String, Translator>()

  private fun client(tag: String): Translator? {
    val lang = TranslateLanguage.fromLanguageTag(tag) ?: return null
    if (lang == TranslateLanguage.ENGLISH) return null
    return clients.getOrPut(lang) {
      Translation.getClient(
        TranslatorOptions.Builder()
          .setSourceLanguage(TranslateLanguage.ENGLISH)
          .setTargetLanguage(lang)
          .build()
      )
    }
  }

  override fun definition() = ModuleDefinition {
    Name("MlTranslate")

    Function("deviceLanguage") { Locale.getDefault().language }

    Function("isSupported") { tag: String -> client(tag) != null }

    AsyncFunction("ensureModel") { tag: String, wifiOnly: Boolean, promise: Promise ->
      val c = client(tag)
      if (c == null) { promise.resolve(false); return@AsyncFunction }
      val cond = DownloadConditions.Builder().apply { if (wifiOnly) requireWifi() }.build()
      c.downloadModelIfNeeded(cond)
        .addOnSuccessListener { promise.resolve(true) }
        .addOnFailureListener { e -> promise.reject("ERR_MODEL", e.message ?: "Model download failed", e) }
    }

    AsyncFunction("translate") { texts: List<String>, tag: String, promise: Promise ->
      val c = client(tag)
      if (c == null) { promise.resolve(texts); return@AsyncFunction }
      val out = arrayOfNulls<String>(texts.size)
      if (texts.isEmpty()) { promise.resolve(emptyList<String>()); return@AsyncFunction }
      var left = texts.size
      val lock = Any()
      texts.forEachIndexed { i, t ->
        c.translate(t)
          .addOnSuccessListener { r -> synchronized(lock) { out[i] = r; left--; if (left == 0) promise.resolve(out.map { it ?: "" }) } }
          .addOnFailureListener { synchronized(lock) { out[i] = t; left--; if (left == 0) promise.resolve(out.map { it ?: "" }) } }
      }
    }

    OnDestroy { clients.values.forEach { it.close() }; clients.clear() }
  }
}

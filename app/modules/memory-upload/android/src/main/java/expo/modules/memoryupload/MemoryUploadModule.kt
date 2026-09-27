package expo.modules.memoryupload

import android.app.Activity
import android.content.Intent
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.net.HttpURLConnection
import java.net.URL
import java.util.UUID
import java.util.concurrent.Executors

class MemoryUploadModule : Module() {
  private val requestCode = 54017
  private val maxBytes = 5 * 1024 * 1024
  private val worker = Executors.newSingleThreadExecutor()
  private var pending: Promise? = null
  private var endpoint: URL? = null

  override fun definition() = ModuleDefinition {
    Name("BeautilyzeMemoryUpload")

    AsyncFunction("pickAndAnalyze") { serverUrl: String, promise: Promise ->
      val activity = appContext.currentActivity
      if (activity == null) {
        promise.reject("NO_ACTIVITY", "Open the app before selecting a photo.", null)
      } else {
        activity.runOnUiThread {
          if (pending != null) {
            promise.reject("BUSY", "A photo selection is already in progress.", null)
          } else {
            try {
              val url = URL(serverUrl)
              require(url.protocol == "https" && url.userInfo == null && url.host.isNotEmpty())
              pending = promise
              endpoint = URL(serverUrl.trimEnd('/') + "/analyze")
              val intent = Intent(Intent.ACTION_GET_CONTENT).apply {
                type = "image/*"
                addCategory(Intent.CATEGORY_OPENABLE)
                putExtra(Intent.EXTRA_MIME_TYPES, arrayOf("image/jpeg", "image/png"))
              }
              activity.startActivityForResult(intent, requestCode)
            } catch (_: Exception) {
              pending = null
              endpoint = null
              promise.reject("PICKER_UNAVAILABLE", "Photo selection needs an HTTPS server and an available photo provider.", null)
            }
          }
        }
      }
    }

    OnActivityResult { activity, result ->
      if (result.requestCode == requestCode) {
        val promise = pending
        val url = endpoint
        if (promise != null && url != null) {
          val uri = result.data?.data
          if (result.resultCode != Activity.RESULT_OK || uri == null) {
            pending = null
            endpoint = null
            promise.resolve(null)
          } else {
            worker.execute {
              try {
                val resolver = activity.contentResolver
                require(uri.scheme == "content")
                val mime = resolver.getType(uri)
                require(mime == "image/jpeg" || mime == "image/png")
                // Read at most the server limit plus one byte; never create a file.
                val bytes = resolver.openInputStream(uri)?.use { input ->
                  val buffer = ByteArray(maxBytes + 1)
                  var length = 0
                  while (length < buffer.size) {
                    val count = input.read(buffer, length, buffer.size - length)
                    if (count < 0) break
                    length += count
                  }
                  require(length in 1..maxBytes)
                  buffer.copyOf(length).also { buffer.fill(0) }
                } ?: throw IllegalArgumentException()
                try {
                  val response = upload(url, bytes, mime!!)
                  activity.runOnUiThread {
                    pending = null
                    endpoint = null
                    promise.resolve(response)
                  }
                } finally { bytes.fill(0) }
              } catch (_: Exception) {
                activity.runOnUiThread {
                  pending = null
                  endpoint = null
                  promise.reject("UPLOAD_FAILED", "Could not analyze this photo. Choose a JPEG or PNG under 5 MB and check the server connection.", null)
                }
              }
            }
          }
        }
      }
    }
  }

  private fun upload(url: URL, image: ByteArray, mime: String): String {
    val boundary = UUID.randomUUID().toString()
    val header = "--$boundary\r\nContent-Disposition: form-data; name=\"file\"; filename=\"image\"\r\nContent-Type: $mime\r\n\r\n".toByteArray()
    val tail = "\r\n--$boundary--\r\n".toByteArray()
    val connection = url.openConnection() as HttpURLConnection
    try {
      connection.requestMethod = "POST"
      connection.connectTimeout = 60000
      connection.readTimeout = 60000
      connection.doOutput = true
      connection.useCaches = false
      connection.instanceFollowRedirects = false
      connection.setRequestProperty("Content-Type", "multipart/form-data; boundary=$boundary")
      connection.setRequestProperty("Cache-Control", "no-store")
      connection.setFixedLengthStreamingMode(header.size + image.size + tail.size)
      connection.outputStream.use { it.write(header); it.write(image); it.write(tail) }
      check(connection.responseCode in 200..299)
      return connection.inputStream.bufferedReader().use { it.readText() }
    } finally { connection.disconnect() }
  }
}

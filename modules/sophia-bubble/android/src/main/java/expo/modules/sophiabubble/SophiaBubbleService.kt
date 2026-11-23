package expo.modules.sophiabubble

import android.annotation.SuppressLint
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.PixelFormat
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.IBinder
import android.text.Editable
import android.text.InputType
import android.text.TextWatcher
import android.util.TypedValue
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.ViewConfiguration
import android.view.WindowManager
import android.view.inputmethod.InputMethodManager
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat
import java.io.File
import kotlin.math.abs
import kotlin.math.min

/**
 * Foreground service that draws a small draggable bubble over other apps. Tapping it opens a compact
 * search panel over the game; tapping × collapses it back to the bubble. Stops from the notification
 * or from the app.
 */
class SophiaBubbleService : Service() {
  companion object {
    @Volatile var running = false
    const val DATA_FILE = "sophia_bubble.json"
    const val ACTION_START = "expo.modules.sophiabubble.START"
    const val ACTION_STOP = "expo.modules.sophiabubble.STOP"
    private const val CHANNEL_ID = "sophia_bubble"
    private const val NOTIFICATION_ID = 7341

    // Glacial Obsidian palette
    private val BG = Color.parseColor("#090E17")
    private val SURFACE = Color.parseColor("#111927")
    private val MODAL = Color.parseColor("#182235")
    private val BORDER = Color.parseColor("#1E293B")
    private val CYAN = Color.parseColor("#38BDF8")
    private val TEXT = Color.parseColor("#F8FAFC")
    private val TEXT2 = Color.parseColor("#94A3B8")
    private val MUTED = Color.parseColor("#64748B")
  }

  private lateinit var wm: WindowManager
  private var entries: List<BubbleEntry> = emptyList()
  private var bubble: View? = null
  private var bubbleParams: WindowManager.LayoutParams? = null
  private var panel: View? = null
  private var results: LinearLayout? = null

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onCreate() {
    super.onCreate()
    wm = getSystemService(Context.WINDOW_SERVICE) as WindowManager
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (intent?.action == ACTION_STOP) {
      stopSelf()
      return START_NOT_STICKY
    }
    startInForeground()
    entries = BubbleSearch.load(File(filesDir, DATA_FILE))
    running = true
    if (bubble == null && panel == null) showBubble()
    return START_NOT_STICKY
  }

  override fun onDestroy() {
    running = false
    removeView(panel); panel = null
    removeView(bubble); bubble = null
    super.onDestroy()
  }

  // ---------------------------------------------------------------- notification

  private fun startInForeground() {
    val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && nm.getNotificationChannel(CHANNEL_ID) == null) {
      nm.createNotificationChannel(NotificationChannel(CHANNEL_ID, "Sophia quick search", NotificationManager.IMPORTANCE_LOW))
    }
    val stop = PendingIntent.getService(
      this, 0, Intent(this, SophiaBubbleService::class.java).setAction(ACTION_STOP),
      PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
    )
    val notification = NotificationCompat.Builder(this, CHANNEL_ID)
      .setSmallIcon(android.R.drawable.ic_menu_search)
      .setContentTitle("Sophia quick search is on")
      .setContentText("Tap the bubble to search answers. Tap Stop to remove it.")
      .setOngoing(true)
      .setPriority(NotificationCompat.PRIORITY_LOW)
      .addAction(0, "Stop", stop)
      .build()
    val type = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE else 0
    ServiceCompat.startForeground(this, NOTIFICATION_ID, notification, type)
  }

  // ---------------------------------------------------------------- helpers

  private fun dp(v: Int): Int = TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v.toFloat(), resources.displayMetrics).toInt()

  @Suppress("DEPRECATION")
  private fun overlayType(): Int =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
    else WindowManager.LayoutParams.TYPE_PHONE

  private fun rounded(fill: Int, stroke: Int, radiusDp: Int, strokeDp: Int = 1) = GradientDrawable().apply {
    setColor(fill)
    cornerRadius = dp(radiusDp).toFloat()
    setStroke(dp(strokeDp), stroke)
  }

  private fun removeView(v: View?) {
    if (v == null) return
    try { wm.removeView(v) } catch (e: Exception) { /* already gone */ }
  }

  // ---------------------------------------------------------------- bubble

  /** Magnifier glyph drawn with lines (no emoji or bitmap). */
  private class SearchGlyph(context: Context, private val color: Int) : View(context) {
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.STROKE; strokeCap = Paint.Cap.ROUND }
    override fun onDraw(canvas: Canvas) {
      super.onDraw(canvas)
      val s = min(width, height).toFloat()
      paint.color = color
      paint.strokeWidth = s * 0.09f
      val r = s * 0.22f
      val cx = s * 0.44f
      val cy = s * 0.44f
      canvas.drawCircle(cx, cy, r, paint)
      canvas.drawLine(cx + r * 0.72f, cy + r * 0.72f, s * 0.78f, s * 0.78f, paint)
    }
  }

  @SuppressLint("ClickableViewAccessibility")
  private fun showBubble() {
    val size = dp(56)
    val view = FrameLayout(this).apply {
      background = GradientDrawable().apply {
        shape = GradientDrawable.OVAL
        setColor(MODAL)
        setStroke(dp(2), CYAN)
      }
      elevation = dp(6).toFloat()
      contentDescription = "Sophia quick search"
      addView(SearchGlyph(context, CYAN), FrameLayout.LayoutParams(size, size))
    }
    val params = WindowManager.LayoutParams(
      size, size, overlayType(),
      WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
      PixelFormat.TRANSLUCENT,
    ).apply {
      gravity = Gravity.TOP or Gravity.START
      x = resources.displayMetrics.widthPixels - size - dp(12)
      y = (resources.displayMetrics.heightPixels * 0.55f).toInt()
    }

    val slop = ViewConfiguration.get(this).scaledTouchSlop
    var downX = 0f; var downY = 0f; var startX = 0; var startY = 0; var dragging = false
    view.setOnTouchListener { _, ev ->
      when (ev.action) {
        MotionEvent.ACTION_DOWN -> { downX = ev.rawX; downY = ev.rawY; startX = params.x; startY = params.y; dragging = false; true }
        MotionEvent.ACTION_MOVE -> {
          val dx = ev.rawX - downX; val dy = ev.rawY - downY
          if (!dragging && (abs(dx) > slop || abs(dy) > slop)) dragging = true
          if (dragging) {
            params.x = (startX + dx).toInt()
            params.y = (startY + dy).toInt()
            try { wm.updateViewLayout(view, params) } catch (e: Exception) { }
          }
          true
        }
        MotionEvent.ACTION_UP -> { if (!dragging) openPanel(); true }
        else -> false
      }
    }
    wm.addView(view, params)
    bubble = view
    bubbleParams = params
  }

  // ---------------------------------------------------------------- panel

  private fun openPanel() {
    if (panel != null) return
    bubble?.visibility = View.GONE

    val width = min(resources.displayMetrics.widthPixels - dp(24), dp(380))
    val root = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      background = rounded(SURFACE, BORDER, 16)
      setPadding(dp(14), dp(12), dp(14), dp(12))
      elevation = dp(8).toFloat()
    }

    val header = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER_VERTICAL }
    header.addView(TextView(this).apply {
      text = "Sophia's Test"
      setTextColor(TEXT); textSize = 16f; typeface = Typeface.DEFAULT_BOLD
    }, LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f))
    header.addView(TextView(this).apply {
      text = "×"
      setTextColor(TEXT2); textSize = 24f; gravity = Gravity.CENTER
      contentDescription = "Close search"
      setOnClickListener { closePanel() }
    }, LinearLayout.LayoutParams(dp(40), dp(40)))
    root.addView(header)

    val input = EditText(this).apply {
      hint = "Type 2–3 words from the question"
      setHintTextColor(MUTED); setTextColor(TEXT); textSize = 15f
      inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS
      isSingleLine = true
      background = rounded(BG, CYAN, 10)
      setPadding(dp(12), dp(10), dp(12), dp(10))
    }
    root.addView(input, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT).apply { topMargin = dp(6) })

    val list = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
    val scroll = ScrollView(this).apply { addView(list) }
    root.addView(scroll, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, (resources.displayMetrics.heightPixels * 0.34f).toInt()).apply { topMargin = dp(8) })
    results = list
    renderResults("")

    input.addTextChangedListener(object : TextWatcher {
      override fun beforeTextChanged(s: CharSequence?, a: Int, b: Int, c: Int) {}
      override fun onTextChanged(s: CharSequence?, a: Int, b: Int, c: Int) {}
      override fun afterTextChanged(s: Editable?) { renderResults(s?.toString() ?: "") }
    })

    val params = WindowManager.LayoutParams(
      width, WindowManager.LayoutParams.WRAP_CONTENT, overlayType(),
      // Focusable so the keyboard works; touches outside the panel still reach the game.
      WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,
      PixelFormat.TRANSLUCENT,
    ).apply {
      gravity = Gravity.TOP or Gravity.CENTER_HORIZONTAL
      y = dp(48)
      softInputMode = WindowManager.LayoutParams.SOFT_INPUT_STATE_VISIBLE or WindowManager.LayoutParams.SOFT_INPUT_ADJUST_PAN
    }
    wm.addView(root, params)
    panel = root
    input.requestFocus()
    input.post {
      (getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager).showSoftInput(input, InputMethodManager.SHOW_IMPLICIT)
    }
  }

  private fun closePanel() {
    val p = panel ?: return
    (getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager).hideSoftInputFromWindow(p.windowToken, 0)
    removeView(p)
    panel = null
    results = null
    bubble?.visibility = View.VISIBLE
  }

  private fun renderResults(query: String) {
    val list = results ?: return
    list.removeAllViews()
    if (query.isBlank()) {
      list.addView(note(if (entries.isEmpty()) "No answers loaded. Open Frozen Codex and turn the bubble on again." else "${entries.size} answers ready."))
      return
    }
    val found = BubbleSearch.search(entries, query, 5)
    if (found.isEmpty()) {
      list.addView(note("No match. Try fewer or different words."))
      return
    }
    found.forEachIndexed { i, e ->
      val card = LinearLayout(this).apply {
        orientation = LinearLayout.VERTICAL
        background = rounded(if (i == 0) MODAL else BG, if (i == 0) CYAN else BORDER, 10)
        setPadding(dp(12), dp(8), dp(12), dp(10))
      }
      card.addView(TextView(this).apply { text = e.question; setTextColor(TEXT2); textSize = 13f })
      card.addView(TextView(this).apply {
        text = e.answer
        setTextColor(if (i == 0) CYAN else TEXT); textSize = if (i == 0) 18f else 15f; typeface = Typeface.DEFAULT_BOLD
      })
      list.addView(card, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT).apply { bottomMargin = dp(6) })
    }
  }

  private fun note(t: String) = TextView(this).apply {
    text = t; setTextColor(MUTED); textSize = 13f; setPadding(dp(2), dp(4), dp(2), dp(4))
  }
}

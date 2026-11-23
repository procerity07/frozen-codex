package expo.modules.sophiabubble

import org.json.JSONArray
import java.io.File
import java.text.Normalizer

/** One Sophia's Test question with its answer, pre-normalised for fast matching. */
data class BubbleEntry(val question: String, val answer: String, val words: List<String>)

/** Plain-Kotlin search used by the floating bubble (no Android UI dependencies). */
object BubbleSearch {
  private val marks = Regex("\\p{Mn}+")
  private val nonWord = Regex("[^a-z0-9 ]+")
  private val spaces = Regex("\\s+")

  fun normalize(s: String): String =
    Normalizer.normalize(s.lowercase(), Normalizer.Form.NFD)
      .replace(marks, "")
      .replace(nonWord, " ")
      .replace(spaces, " ")
      .trim()

  /** Reads the JSON array [{"q": "...", "a": "...", "k": "..."}] written by the app. */
  fun parse(json: String): List<BubbleEntry> {
    val arr = JSONArray(json)
    val out = ArrayList<BubbleEntry>(arr.length())
    for (i in 0 until arr.length()) {
      val o = arr.optJSONObject(i) ?: continue
      val q = o.optString("q")
      val a = o.optString("a")
      if (q.isBlank() || a.isBlank()) continue
      val words = normalize("$q ${o.optString("k")}").split(' ').filter { it.isNotEmpty() }
      out.add(BubbleEntry(q, a, words))
    }
    return out
  }

  fun load(file: File): List<BubbleEntry> =
    try { if (file.exists()) parse(file.readText()) else emptyList() } catch (e: Exception) { emptyList() }

  /**
   * Every query word must match the start of (or be contained in) a word of the question or its keywords.
   * Results are ranked by how well all words match; whole-word prefix matches rank highest.
   */
  fun search(entries: List<BubbleEntry>, query: String, limit: Int = 5): List<BubbleEntry> {
    val tokens = normalize(query).split(' ').filter { it.isNotEmpty() }
    if (tokens.isEmpty()) return emptyList()
    val scored = ArrayList<Pair<Double, BubbleEntry>>()
    for (e in entries) {
      var total = 0.0
      var allMatched = true
      for (t in tokens) {
        var best = 0.0
        for (w in e.words) {
          if (w == t) { best = 1.2; break }
          if (w.startsWith(t)) best = maxOf(best, 1.0)
          else if (t.length >= 3 && w.contains(t)) best = maxOf(best, 0.7)
        }
        if (best == 0.0) { allMatched = false; break }
        total += best
      }
      if (allMatched) scored.add(Pair(total / tokens.size, e))
    }
    return scored.sortedWith(compareByDescending<Pair<Double, BubbleEntry>> { it.first }.thenBy { it.second.words.size })
      .take(limit).map { it.second }
  }
}

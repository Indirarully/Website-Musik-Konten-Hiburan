/**
 * recommend.js — Collaborative Filtering + Cosine Similarity + KNN
 * Sistem Rekomendasi Musik Pop — MusicRec
 * Indira Rully Pricilia (312210230)
 *
 * Alur kerja:
 * 1. Ambil rating user dari localStorage (mr_ratings)
 * 2. Hitung Cosine Similarity antara user dengan setiap simulated user
 * 3. Ambil K tetangga terdekat (KNN, default K=3)
 * 4. Kumpulkan lagu yang disukai tetangga tapi belum dirating user
 * 5. Cari lagu-lagu tersebut ke Deezer API
 * 6. Tampilkan hasil rekomendasi di halaman
 */

// ─── DATASET SIMULASI ──────────────────────────────────────────────────────
// Setiap user punya rating 1-5 untuk lagu-lagu pop.
// song_id = kata kunci pencarian Deezer (judul + artis).
const SIMULATED_USERS = {
  user_A: {
    'Anti-Hero Taylor Swift': 5,
    'Espresso Sabrina Carpenter': 5,
    'Flowers Miley Cyrus': 4,
    'As It Was Harry Styles': 4,
    'Dynamite BTS': 3,
    'Seven Jung Kook': 2,
    'Butter BTS': 3,
    'Love Story Taylor Swift': 4,
    'Cruel Summer Taylor Swift': 5,
  },
  user_B: {
    'Dynamite BTS': 5,
    'Butter BTS': 5,
    'Seven Jung Kook': 5,
    'Be There for Me NCT 127': 4,
    'Favorite NCT WISH': 4,
    'Someday Michael Learns To Rock': 3,
    'Anti-Hero Taylor Swift': 3,
    'Stay The Kid LAROI': 4,
    'Easy Troye Sivan': 3,
  },
  user_C: {
    'Be There for Me NCT 127': 5,
    'Favorite NCT WISH': 5,
    'Dynamite BTS': 4,
    'Butter BTS': 4,
    'Ode to Love NCT WISH': 5,
    'Baby Don\'t Stop NCT U': 4,
    'Love Shot EXO': 4,
    'Anti-Hero Taylor Swift': 2,
    'Espresso Sabrina Carpenter': 2,
  },
  user_D: {
    'Flowers Miley Cyrus': 5,
    'As It Was Harry Styles': 5,
    'Watermelon Sugar Harry Styles': 5,
    'Espresso Sabrina Carpenter': 4,
    'Please Please Please Sabrina Carpenter': 4,
    'Anti-Hero Taylor Swift': 4,
    'Cruel Summer Taylor Swift': 4,
    'Shake It Off Taylor Swift': 3,
    'Dynamite BTS': 2,
  },
  user_E: {
    'Someday Michael Learns To Rock': 5,
    'That\'s Why You Go Away Michael Learns To Rock': 5,
    'Paint My Love Michael Learns To Rock': 5,
    'My Love Westlife': 5,
    'You Raise Me Up Westlife': 4,
    'Uptown Girl Westlife': 4,
    'Be There for Me NCT 127': 3,
    'Anti-Hero Taylor Swift': 3,
  },
  user_F: {
    'Anti-Hero Taylor Swift': 5,
    'Cruel Summer Taylor Swift': 5,
    'Love Story Taylor Swift': 5,
    'Shake It Off Taylor Swift': 4,
    'Blank Space Taylor Swift': 4,
    'Flowers Miley Cyrus': 4,
    'As It Was Harry Styles': 3,
    'Espresso Sabrina Carpenter': 3,
    'Dynamite BTS': 2,
  },
  user_G: {
    'Dynamite BTS': 5,
    'Butter BTS': 5,
    'Seven Jung Kook': 4,
    'Favorite NCT WISH': 5,
    'Ode to Love NCT WISH': 4,
    'Be There for Me NCT 127': 5,
    'Baby Don\'t Stop NCT U': 4,
    'Love Shot EXO': 5,
    'Growl EXO': 4,
  },
  user_H: {
    'Espresso Sabrina Carpenter': 5,
    'Please Please Please Sabrina Carpenter': 5,
    'As It Was Harry Styles': 5,
    'Watermelon Sugar Harry Styles': 4,
    'Flowers Miley Cyrus': 4,
    'Stay The Kid LAROI': 5,
    'Easy Troye Sivan': 4,
    'Anti-Hero Taylor Swift': 4,
    'Cruel Summer Taylor Swift': 3,
  },
  user_I: {
    'My Love Westlife': 5,
    'Uptown Girl Westlife': 5,
    'You Raise Me Up Westlife': 5,
    'Someday Michael Learns To Rock': 4,
    'That\'s Why You Go Away Michael Learns To Rock': 4,
    'Paint My Love Michael Learns To Rock': 4,
    'Unchained Melody Righteous Brothers': 3,
    'Anti-Hero Taylor Swift': 2,
    'Dynamite BTS': 2,
  },
  user_J: {
    'Seven Jung Kook': 5,
    'Dynamite BTS': 5,
    'Stay The Kid LAROI': 5,
    'Easy Troye Sivan': 4,
    'Anti-Hero Taylor Swift': 4,
    'Espresso Sabrina Carpenter': 4,
    'As It Was Harry Styles': 4,
    'Flowers Miley Cyrus': 3,
    'Butter BTS': 4,
  },
};

// ─── COSINE SIMILARITY ────────────────────────────────────────────────────
/**
 * Hitung Cosine Similarity antara dua vektor rating.
 * Rumus: cos(θ) = (A·B) / (|A| × |B|)
 * Hanya lagu yang sama-sama dirating yang dihitung (intersection).
 */
function cosineSimilarity(ratingA, ratingB) {
  const songsA = Object.keys(ratingA);
  const songsB = new Set(Object.keys(ratingB));

  // Hanya ambil lagu yang ada di kedua user (intersection)
  const common = songsA.filter(s => songsB.has(s));
  if (common.length === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  common.forEach(song => {
    dotProduct += ratingA[song] * ratingB[song];
  });

  // Norm dihitung dari semua lagu masing-masing user
  songsA.forEach(s => { normA += ratingA[s] ** 2; });
  Object.values(ratingB).forEach(v => { normB += v ** 2; });

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ─── KNN — AMBIL K TETANGGA TERDEKAT ─────────────────────────────────────
/**
 * Dari semua simulated user, cari K yang paling mirip dengan currentUser.
 * Return array of {userId, similarity} diurutkan dari tertinggi.
 */
function getKNearestNeighbors(currentUserRatings, K = 3) {
  const similarities = [];

  Object.entries(SIMULATED_USERS).forEach(([userId, ratings]) => {
    const sim = cosineSimilarity(currentUserRatings, ratings);
    if (sim > 0) {
      similarities.push({ userId, similarity: sim });
    }
  });

  // Urutkan dari similarity tertinggi
  similarities.sort((a, b) => b.similarity - a.similarity);

  // Ambil K tetangga terdekat
  return similarities.slice(0, K);
}

// ─── PREDIKSI REKOMENDASI ─────────────────────────────────────────────────
/**
 * Kumpulkan lagu dari K tetangga yang belum dirating currentUser.
 * Lagu dengan skor tertinggi (rating tetangga × similarity) jadi prioritas.
 */
function predictRecommendations(currentUserRatings, neighbors) {
  const ratedByUser = new Set(Object.keys(currentUserRatings));
  const songScores = {};
  const songCount  = {};

  neighbors.forEach(({ userId, similarity }) => {
    const neighborRatings = SIMULATED_USERS[userId];
    Object.entries(neighborRatings).forEach(([song, rating]) => {
      if (!ratedByUser.has(song)) {
        if (!songScores[song]) { songScores[song] = 0; songCount[song] = 0; }
        songScores[song] += similarity * rating;
        songCount[song]  += similarity;
      }
    });
  });

  // Hitung weighted average prediction
  const predictions = Object.keys(songScores).map(song => ({
    song,
    predictedRating: songCount[song] > 0
      ? (songScores[song] / songCount[song]).toFixed(2)
      : 0,
  }));

  // Urutkan dari prediksi rating tertinggi
  predictions.sort((a, b) => b.predictedRating - a.predictedRating);
  return predictions;
}

// ─── AMBIL DATA DARI DEEZER API ───────────────────────────────────────────
async function fetchDeezerTrack(query) {
  try {
    const url = `https://corsproxy.io/?${encodeURIComponent(
      'https://api.deezer.com/search?q=' + query + '&limit=1'
    )}`;
    const res  = await fetch(url);
    const data = await res.json();
    if (data.data && data.data.length > 0) {
      const t = data.data[0];
      return {
        t    : t.title,
        a    : t.artist?.name || '',
        g    : 'Pop',
        url  : t.preview || '',
        cover: t.album?.cover_medium || '',
        id   : t.id,
      };
    }
  } catch (e) {
    console.warn('Deezer fetch error:', query, e);
  }
  return null;
}

// ─── AMBIL RATING USER DARI LOCALSTORAGE ─────────────────────────────────
function getCurrentUserRatings() {
  const raw = JSON.parse(localStorage.getItem('mr_ratings') || '[]');
  const ratings = {};
  raw.forEach(item => {
    // key: "judul artis" agar bisa cocok dengan SIMULATED_USERS
    const key = (item.title + ' ' + item.artist).trim();
    if (item.rating && item.rating > 0) {
      ratings[key] = item.rating;
    }
  });
  return ratings;
}

// ─── RENDER REKOMENDASI KE HALAMAN ───────────────────────────────────────
async function renderCFRecommendations() {
  const container = document.getElementById('cfRecList');
  const statusEl  = document.getElementById('cfStatus');
  if (!container) return;

  container.innerHTML = '';
  if (statusEl) statusEl.textContent = '⏳ Menghitung rekomendasi...';

  const currentRatings = getCurrentUserRatings();

  // Kalau user belum rating lagu apapun, tampilkan pesan
  if (Object.keys(currentRatings).length === 0) {
    if (statusEl) statusEl.textContent = '';
    container.innerHTML = `
      <div style="text-align:center;padding:20px;color:var(--sub);font-size:12px">
        🎵 Dengerin dan rating minimal 1 lagu dulu<br>agar rekomendasi bisa muncul!
      </div>`;
    return;
  }

  // Step 1: Hitung Cosine Similarity & ambil K=3 tetangga terdekat (KNN)
  const K         = 3;
  const neighbors = getKNearestNeighbors(currentRatings, K);

  if (neighbors.length === 0) {
    if (statusEl) statusEl.textContent = '';
    container.innerHTML = `
      <div style="text-align:center;padding:20px;color:var(--sub);font-size:12px">
        Belum ada tetangga yang cocok. Coba rating lebih banyak lagu!
      </div>`;
    return;
  }

  // Step 2: Prediksi lagu yang direkomendasikan
  const predictions = predictRecommendations(currentRatings, neighbors);
  const top5        = predictions.slice(0, 5);

  if (top5.length === 0) {
    if (statusEl) statusEl.textContent = '';
    container.innerHTML = `
      <div style="text-align:center;padding:20px;color:var(--sub);font-size:12px">
        Semua lagu rekomendasi sudah pernah kamu rating 👍
      </div>`;
    return;
  }

  // Step 3: Fetch data lagu dari Deezer
  const tracks = await Promise.all(top5.map(p => fetchDeezerTrack(p.song)));

  if (statusEl) statusEl.textContent = '';

  // Step 4: Render hasil
  top5.forEach((pred, i) => {
    const track = tracks[i];
    const title  = track ? track.t  : pred.song.split(' ').slice(0, -1).join(' ') || pred.song;
    const artist = track ? track.a  : pred.song.split(' ').pop();
    const cover  = track ? track.cover : '';
    const url    = track ? track.url   : '';
    const rating = parseFloat(pred.predictedRating).toFixed(1);

    const thumbHtml = cover
      ? `<img src="${cover}" style="width:34px;height:34px;border-radius:8px;object-fit:cover"
           onerror="this.parentElement.innerHTML='<i class=\\'ti ti-music\\'></i>'">`
      : `<i class="ti ti-music"></i>`;

    const item = document.createElement('div');
    item.className = 'rec-item';
    item.style.cursor = 'pointer';
    item.innerHTML = `
      <div class="rec-thumb">${thumbHtml}</div>
      <div class="rec-info">
        <div class="rec-title">${title}</div>
        <div class="rec-sub">${artist} • Pop</div>
      </div>
      <div class="rec-stars">★ ${rating}</div>`;

    if (url) {
      item.onclick = () => {
        if (typeof openPlayer === 'function') {
          openPlayer({ t: title, a: artist, g: 'Pop', url, cover });
        }
      };
    }
    container.appendChild(item);
  });

  // Tampilkan info debug ringan (bermanfaat saat demo ke penguji)
  const debugEl = document.getElementById('cfDebug');
  if (debugEl) {
    const topN = neighbors.map(n =>
      `${n.userId} (sim=${n.similarity.toFixed(3)})`
    ).join(', ');
    debugEl.textContent = `KNN K=${K} | Tetangga: ${topN}`;
  }
}

// ─── EXPORT UNTUK DIPAKAI DI index.html ──────────────────────────────────
window.renderCFRecommendations = renderCFRecommendations;
window.cosineSimilarity        = cosineSimilarity;
window.getKNearestNeighbors    = getKNearestNeighbors;
window.predictRecommendations  = predictRecommendations;

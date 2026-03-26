const express = require('express');
const path = require('path');
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'build')));

const YT_KEY = process.env.YOUTUBE_API_KEY;

// Detect music subcategory from title/channel/tags
function detectSubcategory(title, channel, desc) {
  const t = (title + ' ' + channel + ' ' + (desc||'')).toLowerCase();
  if (t.match(/funk|baile|pancadao|brega/)) return 'Funk';
  if (t.match(/sertanejo|sertanej|country brasil/)) return 'Sertanejo';
  if (t.match(/pagode|samba|boteco/)) return 'Pagode / Samba';
  if (t.match(/rap|trap|hip.?hop|mc |freestyle|cypher/)) return 'Rap / Trap';
  if (t.match(/gospel|louvor|adoracao|worship|hillsong|jesus|cristo/)) return 'Gospel';
  if (t.match(/axe|forro|xote|arrasta|piseiro|pisadinha/)) return 'Forro / Axe';
  if (t.match(/pop|hit|oficial|clipe oficial/) && !t.match(/funk|sertanejo/)) return 'Pop';
  if (t.match(/rock|metal|punk|indie|alternativo/)) return 'Rock';
  if (t.match(/eletronic|eletro|dj |remix|dance|house|edm/)) return 'Eletronica';
  if (t.match(/kpop|k-pop|bts|blackpink|twice|nct|aespa/)) return 'K-Pop';
  if (t.match(/reggaeton|reggae|dancehall|latin|latin pop/)) return 'Reggaeton / Latin';
  if (t.match(/r&b|rnb|soul|blues/)) return 'R&B / Soul';
  return 'Pop';
}

app.get('/api/trending', async (req, res) => {
  const region = req.query.region || 'BR';
  try {
    let videos = [], pageToken = '';
    for (let i = 0; i < 2; i++) {
      // videoCategoryId=10 = Music on YouTube
      const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode=${region}&videoCategoryId=10&maxResults=50&key=${YT_KEY}${pageToken ? '&pageToken=' + pageToken : ''}`;
      const r = await fetch(url);
      const j = await r.json();
      if (j.error) throw new Error(j.error.message);
      videos = videos.concat(j.items || []);
      pageToken = j.nextPageToken || '';
      if (!pageToken) break;
    }

    const result = videos.map((v, i) => ({
      rank: i + 1,
      title: v.snippet.title,
      channel: v.snippet.channelTitle,
      category: detectSubcategory(v.snippet.title, v.snippet.channelTitle, v.snippet.description),
      views: parseInt(v.statistics?.viewCount || 0),
      likes: parseInt(v.statistics?.likeCount || 0),
      comments: parseInt(v.statistics?.commentCount || 0),
      published: v.snippet.publishedAt?.slice(0, 10),
      thumb: v.snippet.thumbnails?.medium?.url,
      id: v.id
    }));

    res.json({ videos: result, fetchedAt: new Date().toISOString(), region });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server on port ' + PORT));

const express = require('express');
const path = require('path');
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'build')));

const YT_KEY = process.env.YOUTUBE_API_KEY;

function detectGenre(title, channel) {
  const t = (title + ' ' + channel).toLowerCase();
  if (t.match(/funk|baile|pancadao|brega funk|mc /)) return 'Funk';
  if (t.match(/sertanejo|sertanej/)) return 'Sertanejo';
  if (t.match(/pagode|samba|boteco/)) return 'Pagode / Samba';
  if (t.match(/\btrap\b|\brap\b|hip.?hop|freestyle|cypher/)) return 'Rap / Trap';
  if (t.match(/gospel|louvor|adoracao|worship|jesus cristo|hillsong/)) return 'Gospel';
  if (t.match(/forro|xote|arrasta|piseiro|pisadinha|axe|ax\xe9/)) return 'Forro / Axe';
  if (t.match(/kpop|k-pop|bts|blackpink|twice|aespa|nct|stray kids/)) return 'K-Pop';
  if (t.match(/rock|metal|punk|indie|alternativo/)) return 'Rock';
  if (t.match(/eletro|eletronica|dj |remix|\bedm\b|house music/)) return 'Eletronica';
  if (t.match(/reggaeton|reggae|dancehall|latin pop/)) return 'Reggaeton / Latin';
  if (t.match(/\br&b\b|rnb|soul|blues/)) return 'R&B / Soul';
  return 'Pop';
}

app.get('/api/trending', async (req, res) => {
  const region = req.query.region || 'BR';
  try {
    let videos = [], pageToken = '';
    for (let i = 0; i < 2; i++) {
      // videoCategoryId=10 filtra apenas MUSICA
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
      genre: detectGenre(v.snippet.title, v.snippet.channelTitle),
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
app.listen(PORT, () => console.log('Music Trending server on port ' + PORT));

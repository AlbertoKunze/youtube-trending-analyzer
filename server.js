const express = require('express');
const path = require('path');
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'build')));

const YT_KEY = process.env.YOUTUBE_API_KEY;

app.get('/api/trending', async (req, res) => {
  const region = req.query.region || 'BR';
  try {
    const catRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videoCategories?part=snippet&regionCode=${region}&hl=pt_BR&key=${YT_KEY}`
    );
    const catJson = await catRes.json();
    if (catJson.error) throw new Error(catJson.error.message);
    const catMap = {};
    (catJson.items || []).forEach(c => { catMap[c.id] = c.snippet.title; });

    let videos = [], pageToken = '';
    for (let i = 0; i < 2; i++) {
      const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode=${region}&maxResults=50&key=${YT_KEY}${pageToken ? '&pageToken=' + pageToken : ''}`;
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
      category: catMap[v.snippet.categoryId] || 'Other',
      views: parseInt(v.statistics?.viewCount || 0),
      likes: parseInt(v.statistics?.likeCount || 0),
      published: v.snippet.publishedAt?.slice(0, 10),
      thumb: v.snippet.thumbnails?.default?.url,
      id: v.id
    }));

    res.json({ videos: result, catMap, fetchedAt: new Date().toISOString() });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running on port ' + PORT));

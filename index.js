const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Your existing API code
const ProxyApi = "https://proxy.techzbots1.workers.dev/?u=";
const animeapi = "/anime/";
const episodeapi = "/episode/";
const dlapi = "/download/";
const searchapi = "/search/";
const popularapi = "https://api.anime-dex.workers.dev/gogoPopular/";
const AvailableServers = [
    "https://api1.anime-dex.workers.dev",
    "https://api2.anime-dex.workers.dev",
    "https://api3.anime-dex.workers.dev",
];

function getApiServer() {
    return AvailableServers[Math.floor(Math.random() * AvailableServers.length)];
}

async function getJson(path, errCount = 0) {
    const ApiServer = getApiServer();
    if (errCount > 2) {
        throw `Too many errors while fetching ${ApiServer}${path}`;
    }
    let url = `${ApiServer}/${path}`;
    if (errCount > 0) {
        console.log("Retrying fetch using proxy");
        url = ProxyApi + encodeURIComponent(url);
    }
    try {
        const response = await fetch(url);
        return await response.json();
    } catch (errors) {
        console.error(errors);
        return getJson(path, errCount + 1);
    }
}

async function getAdFreeDownloadLinks(anime, episode) {
    const data = (await getJson(dlapi + anime + "-episode-" + episode))["results"];
    const adFreeLinks = {
        "AD Free 1": data["adfree1"],
        "AD Free 2": data["adfree2"]
    };
    return adFreeLinks;
}

// Express.js code
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/about', (req, res) => {
    res.render('about');
});

// Define API routes
app.get('/api/anime/:animeName', async (req, res) => {
    const animeName = req.params.animeName;
    try {
        const animeData = await getJson(animeapi + animeName);
        res.json(animeData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/episode/:animeName/:episodeNumber', async (req, res) => {
    const animeName = req.params.animeName;
    const episodeNumber = req.params.episodeNumber;
    try {
        const episodeData = await getJson(episodeapi + animeName + "-episode-" + episodeNumber);
        res.json(episodeData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/adfreedownload', async (req, res) => {
    const anime = req.query.anime;
    const episode = req.query.episode;
    try {
        const downloadLinks = await getAdFreeDownloadLinks(anime, episode);
        res.json(downloadLinks);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/search', async (req, res) => {
    const query = req.query.query;
    if (!query) {
        return res.status(400).json({ error: 'Query parameter "query" is required' });
    }
    try {
        const data = await getJson(searchapi + query);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/popular/:pageNumber', async (req, res) => {
    const pageNumber = req.params.pageNumber;
    try {
        const popularData = await getJson(`${popularapi}${pageNumber}`);
        res.json(popularData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/recent/:pageNumber', async (req, res) => {
    const pageNumber = req.params.pageNumber;
    try {
        const recentData = await getJson(`https://api.anime-dex.workers.dev/recent/${pageNumber}`);
        res.json(recentData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/upcoming/:pageNumber', async (req, res) => {
    const pageNumber = req.params.pageNumber;
    try {
        const upcomingData = await getJson(`https://api.anime-dex.workers.dev/upcoming/${pageNumber}`);
        res.json(upcomingData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}`);
});

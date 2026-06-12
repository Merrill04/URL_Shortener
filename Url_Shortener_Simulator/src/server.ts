import express from "express";
import type { Request, Response} from "express";

const app = express();
const PORT = 3000;

app.use(express.json());

const urlsmap = new Map<string, string>();

app.post('/shorten', (req : Request, res: Response) => {
    const { url } = req.body;

    if(!url){
        res.status(400).json({
            msg: "No url provide."
        });
        return;
    }

    const shortcode = Math.random().toString(36).substring(2, 8);

    urlsmap.set(shortcode, url);

    res.status(201).json({
        msg : `http://localhost:${PORT}/${shortcode}`
    });
});

app.get('/:code', (req: Request, res: Response) => {
    const code = req.params.code as string;

    const originalurl = urlsmap.get(code);

    if(!originalurl){
        res.status(404).json({
            msg: "url not found."
        });
        return;
    }

    res.redirect(originalurl);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

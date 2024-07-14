
/**
 * render previews 
 * via opentype.js
 */

async function renderText(src, text, fontSize, id) {
    // load and parse font
    let buffer = await (await fetch(src)).arrayBuffer();

    // parse
    let font = opentype.parse(buffer);
    //let chars = [... new Set(text.split(''))];

    let glyphs = font.glyphs.glyphs;
    let glyphArr = [];

    // check available glyphs/character support
    for (let i in glyphs) {
        if (glyphs[i].unicode !== undefined) glyphArr.push(glyphs[i].unicode)
    }

    let uniArr = [...new Set(text.replaceAll(' ', '').split(''))].map(ch => { return ch.charCodeAt(0) })
    let match = uniArr.every((val) => glyphArr.includes(val))

    let path, d, tooComplex, markup

    let bb = {
        x: 0,
        y: 0,
        //approximate width for not renderable glyphs
        width: fontSize * text.length * 0.5,
        height: fontSize * 2
    }

    //define y offsets
    let yOffRat = 1.3333
    let yOffset = fontSize * yOffRat;
    let maxComplexity = 3000;

    // if font has glyphs according to text input chars
    if (match) {
        path = font.getPath(text, 0, yOffset, fontSize);
        let { x1, y1, x2, y2 } = path.getBoundingBox();
        bb = {
            x: x1,
            y: y1,
            width: Math.ceil(x2),
            height: y2 - y1
        }

        if (path.commands.length < maxComplexity) {
            // optimize path data
            let pathData = opentypePath2pathData(path);
            pathData = pathDataToRelative(pathDataToShorthands(pathData), 0);
            d = stringifyPathData(pathData);
        } else {
            tooComplex = true
        }
    }

    // prefer bitmap rendering for too complex geometries
    if (tooComplex) {
        let fontSizeC = fontSizeCanvas;
        let canvas = document.createElement('canvas');
        let ctx = canvas.getContext('2d');
        canvas.width = bb.width;
        canvas.height = fontSizeC * 2;

        ctx = font.draw(ctx, text, 0, fontSizeC * yOffRat, fontSizeC)
        let dataUrl = canvas.toDataURL('image/webp', 0)
        markup = `<image id="${id}" class="f" x="0" y="0"  height="100%" href="${dataUrl}" />\n`;
        return { markup: markup, bb: bb };

    }

    //render text placeholder: e.g for  icon fonts
    if (!d || !match) {
        markup = `<text id="${id}" class="f" x="0" y="${yOffset}" font-size="${fontSize}" font-family="sans-serif" fill="#999" >[${text}]</text>\n`;
        //console.log(text, 'no match');
    } else {
        markup = `<path id="${id}" class="f" d="${d}" />\n`;
    }
    return { markup: markup, bb: bb };
}
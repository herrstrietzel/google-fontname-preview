let fontList;
// font size for svg rendering
let fontSize = 500;
let fontSizeCanvas = +inputFontSize.value;
let previewWidth = 20;
let exportSingleFiles = inputSingleFiles.checked;
let exportSprite = inputSprite.checked;
let showPreview = inputShowPreview.checked;


    (async () => {

        //init - get font list
        updateOptions();

        let inputs = document.querySelectorAll('.inputs');

        inputs.forEach(inp => {
            inp.addEventListener('change', e => {
                updateOptions()
            })
        })

        btnGenerate.addEventListener('click', async (e) => {
            btnDownload.classList.add('dsp-non');
            await generateSprites();
        })


        async function updateOptions() {
            fontList = await fetchFontList();
            fontSizeCanvas = +inputFontSize.value;
            exportSingleFiles = inputSingleFiles.checked;
            exportSprite = inputSprite.checked;
            showPreview = inputShowPreview.checked;
        }


        /**
         * generate preview sprite
         */
        async function generateSprites() {

            processedCurrent.textContent='';
            processedTotal.textContent='';
            processedState.textContent='';

            if (!exportSingleFiles && !exportSprite) {
                alert('No export specified')
                return false
            }

            /**
             * separate alphabetically
             */
            let previeObj = {
                'a': []
            }

            let lastLetter = 'a'
            for (let i = 0; i < fontList.length; i++) {
                let item = fontList[i];
                let { family, menu } = item;

                let firstLetter = family.substring(0, 1).toLowerCase();
                if (lastLetter !== firstLetter) {
                    previeObj[firstLetter] = [];
                }
                previeObj[firstLetter].push({ family: family, menu: menu });
                lastLetter = firstLetter
            }


            /**
             * create zip 
             * collect data for zip
             */

            let zip = new JSZip();

            /**
             * generate svg sprites 
             * per letter
             */

            processedTotal.textContent = fontList.length;
            let processed = 0;

            // preview
            let previewHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generate google font previews</title>
    <style>
        body {
            font-size: 1em;
            font-family:sans-serif;
        }
        figcaption {
            font-size: 10px;
        }

        img {
            height: 5em;
            border: 1px solid #ccc;
        }
    </style>
</head>`;

            let previewHtmlBody = ``;
            let previewImgList = [];

            lastLetter = 'a';
            previewHtmlBody += `<h3>${lastLetter.toUpperCase()}</h3><section class="section-letter first" id="${lastLetter}">`;
            navLetters.innerHTML = `<li class="li-nav"><a href="#${lastLetter}">${lastLetter}</a></li>`


            for (l in previeObj) {

                let fonts = previeObj[l];
                let svgMarkupBody = '';
                let maxWidth = 0;


                //limit letter range fo testing
                //if (l !== 'a' && l !== 'b'  && l !== 'c' ) continue

                for (let i = 0; i < fonts.length; i++) {
                    let item = fonts[i];
                    let { family, menu } = item;
                    let id = family.toLowerCase().replaceAll(' ', '-')
                    let textPath = await renderText(menu, family, fontSize, id);
                    let { markup, bb } = textPath;
                    svgMarkupBody += textPath.markup

                    //add width for total viewBox
                    maxWidth = bb.width>maxWidth ? bb.width : maxWidth;

                    //single svg
                    let singleSvg = `<svg id="fnt-${family}" viewBox="0 0 ${Math.ceil(bb.width + 1)} ${fontSize * 2}" xmlns="http://www.w3.org/2000/svg">` + markup + `</svg>`;

                    if (exportSingleFiles) zip.file(`img/${family}.svg`, singleSvg);

                    processed++;
                    processedCurrent.textContent = processed;
                }


                // add sprite svg
                let svgMarkup = `<svg id="${l}" viewBox="0 0 ${Math.ceil(maxWidth)} ${fontSize * 2}" xmlns="http://www.w3.org/2000/svg">
<style>.f {display: none;}.f:target {display: block;}</style>\n`+ svgMarkupBody + `</svg>`;

                /**
                 * add to zip 
                 */

                if (exportSprite) zip.file(`sprites/${l}.svg`, svgMarkup);


                // optional: preview
                for (let i = 0; i < fonts.length; i++) {

                    let item = fonts[i];
                    let { family, menu } = item;
                    let id = family.toLowerCase().replaceAll(' ', '-')
                    let firstLetter = family.substring(0,1).toLowerCase();


                    // add section on letter change
                    if(lastLetter != firstLetter){
                        previewHtmlBody += `</section><h3>${firstLetter.toUpperCase()}</h3><section class="section-letter" id="${firstLetter}">`;
                        navLetters.insertAdjacentHTML('beforeend', `<li class="li-nav"><a href="#${firstLetter}">${firstLetter}</a></li>`);
                    }

                    //add to preview list
                    previewImgList.push({ family: family, img: `${l}.svg#${id}` });

                    previewHtmlBody += `
                <figure>
                    <figcaption>${family}</figcaption>
                    <img src="sprites/${l}.svg#${id}" title="${family}" alt="${family}" loading="lazy">
                </figure>`;

                    lastLetter = firstLetter;

                }
            }

            // get preview Html
            previewHtml += previewHtmlBody + '</body></html>';

            zip.file(`previews.html`, previewHtml);
            zip.file(`previews.json`, JSON.stringify(previewImgList));

            //show preview
            if (showPreview) {
                previewList.innerHTML = previewHtmlBody.replaceAll('sprites/', 'preview_images/sprites/');
            }

            processedState.textContent = ' Creating zip download - please wait ...';

            //output zip 
            let blob = await zip.generateAsync({
                type: "blob"
            });

            //check php is available
            let testPhp = await (await fetch('php/save_unzip.php')).text()

            if (testPhp === 'php available') {
                //save to server
                const formData = new FormData();
                formData.append('zipFile', new File([blob], "previews.zip"));


                //send to php for file saving
                let res = await fetch('php/save_unzip.php', {
                    method: "POST",
                    body: formData
                });

            }


            btnDownload.href = await URL.createObjectURL(blob);
            btnDownload.download = 'previews' + '.zip';
            btnDownload.classList.remove('dsp-non');

            let filesize = +(blob.size/1024/1024).toFixed(2);

            btnDownload.textContent = `Download preview images ${filesize} MB`;
            processedState.textContent = 'Zip is ready!';

        }



        /**
         * render previews 
         * via ppentype.js
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
                width: fontSize * text.length*0.5,
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




        /**
         * fetch font list
         */

        async function fetchFontList() {
            let apiKey = inputApiKey.value;
            let cacheJson = `json/gfontList_vf_ttf.json`;

            //get cache or fresh list from API
            let fontListUrl = apiKey ?
                `https://www.googleapis.com/webfonts/v1/webfonts?capability=VF&capability=CAPABILITY_UNSPECIFIED&sort=alpha&key=${apiKey}` :
                cacheJson;

            let res = await fetch(fontListUrl);
            if (!res.ok) {
                //console.log('API key is not valid - we take the cache!');
                spanApiValidity.textContent = 'API key is not valid - we take the cache! Cached font list may not be up-to-date! ';
                spanApiValidity.className = 'invalid';

                res = await fetch(cacheJson);
            } else {
                //console.log('API key is valid');
                if(apiKey)
                spanApiValidity.textContent = 'API key is valid! ';
                spanApiValidity.className = 'valid';
            }

            let fontList = await (await (res.json())).items;
            return fontList;
        }

    })();

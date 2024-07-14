let fontList;
// font size for svg rendering
let fontSize = 500;
let fontSizeCanvas = +inputFontSize.value;
let previewWidth = 20;
let exportSingleFiles = inputSingleFiles.checked;
let exportSprite = inputSprite.checked;
let showPreview = true;

// allow caching and flushing
let flush = window.location.hash ? window.location.hash.includes('flush') : false;
let useCache = !inputApiKey.value.trim() && !flush ? (true) : false;
if (flush) {
    localStorage.removeItem('previeObj');
}


let sampleText = inputSampleText.value;


//add letter range checkboxes
let letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
let chHtml = '';
letters.forEach(l => {
    chHtml += `<label><input class="inputs inputsFilterLetter" type="checkbox" value="${l}" checked>${l.toUpperCase()}</label> &nbsp;`
})
chHtml += `<button class="btn-default" id="btnDeselect" type="button">Deselect all</button> <button class="btn-default" id="btnSelectAll" type="button">Select all</button>`;


ckeckboxLetters.insertAdjacentHTML('beforeend', chHtml);
let checkboxes = document.querySelectorAll('.inputsFilterLetter');
let letterSelection = [...document.querySelectorAll('.inputsFilterLetter:checked')].map(item => { return item.value });


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

    btnDeselect.onclick = () => {
        checkboxes.forEach(ch => {
            ch.checked = false
        })
        updateOptions();
    }
    
    btnSelectAll.onclick = () => {
        checkboxes.forEach(ch => {
            ch.checked = true
        })
        updateOptions();
    }



    async function updateOptions() {
        fontList = await fetchFontList();
        fontSizeCanvas = +inputFontSize.value;
        exportSingleFiles = inputSingleFiles.checked;
        exportSprite = inputSprite.checked;
        useCache = !inputApiKey.value.trim() && !flush ? (true) : false;
        sampleText = inputSampleText.value;
        letterSelection = [...document.querySelectorAll('.inputsFilterLetter:checked')].map(item => { return item.value });

    }


    /**
     * generate preview sprite
     */
    async function generateSprites() {

        processedCurrent.textContent = '';
        processedTotal.textContent = '';
        processedState.textContent = '';

        if (!exportSingleFiles && !exportSprite) {
            alert('No export specified')
            return false
        }

        /**
         * separate alphabetically
         */

        let previeObj;
        if (useCache) {
            let previeObjCache = localStorage.getItem('previeObj');
            previeObj = previeObjCache ? JSON.parse(previeObjCache) : '';
        }


        // rebuild new previeObj
        let lastLetter = 'a'

        if (!previeObj) {
            previeObj = {
                'a': []
            }

            for (let i = 0; i < fontList.length; i++) {
                let item = fontList[i];
                let { family, menu, category, variants } = item;
                //console.log(item);
                let isvf = item.axes !== undefined;


                //set menu or full font
                let fontFileRegular = item.files['400'] ? item.files['400'] : (item.files['regular'] ? item.files['regular'] : Object.values(item.files)[0]);
                let fontFile = fontFileRegular;
                menu = sampleText ? fontFile : menu;

                let firstLetter = family.substring(0, 1).toLowerCase();
                if (lastLetter !== firstLetter) {
                    previeObj[firstLetter] = [];
                }

                previeObj[firstLetter].push({ family: family, menu: menu, category: category, isvf: isvf, variants: variants.join(', ') });
                lastLetter = firstLetter
            }
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
    <title>Generate google font previews</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-Equiv="Cache-Control" Content="no-cache" />
    <meta http-Equiv="Pragma" Content="no-cache" />
    <meta http-Equiv="Expires" Content="0" />

    <link rel="stylesheet" href="../css/style.css">

    <script src="../js/preview.js" defer></script>
    <style>
        body {
            font-size: 1em;
            font-family:sans-serif;
        }
        figcaption {
            font-size: 10px;
        }

        img {
            border: 1px solid #ccc;
        }
            header{
            position:sticky;
            top:0;
            background:#fff;
            }
    </style>
</head>`;

        let previewHtmlBody = `<body id="main"><header id="header"></header>`;
        let previewImgList = [];


        lastLetter = 'a';
        previewHtmlBody += `<section class="section-letter first" id="${lastLetter}">`;

        //benchmarks
        let t0 = performance.now();

        //cache previeObj
        if (useCache) {
            localStorage.setItem('previeObj', JSON.stringify(previeObj))
        }


        for (l in previeObj) {

            let fonts = previeObj[l];
            let svgMarkupBody = '';
            let maxWidth = 0;

            //limit letter range fo testing
            if (!letterSelection.includes(l)) continue;
            //if (l !== 'a') continue
            //if (l !== 'a' && l !== 'b'  && l !== 'c' ) continue

            let url = `preview_images/sprites/${l}.svg`;
            let spriteCache = await fetch(url);
            let svgCache, bbCache

            if (spriteCache.ok && useCache) {
                svgCache = new DOMParser().parseFromString(await (await (spriteCache).text()), 'text/html').querySelector('svg');
                let vB = svgCache.getAttribute('viewBox').split(' ');
                bbCache = { x: +vB[0], y: +vB[1], width: +vB[2], height: +vB[3] };
            }


            for (let i = 0; i < fonts.length; i++) {
                let item = fonts[i];
                let { family, menu } = item;
                let id = family.toLowerCase().replaceAll(' ', '-');
                let textPathCached = svgCache ? svgCache.getElementById(`${id}`) : '';


                let renderedText = sampleText ? sampleText : family;
                //console.log(renderedText);

                let textPath = textPathCached ? { markup: new XMLSerializer().serializeToString(textPathCached), bb: bbCache } : await renderText(menu, renderedText, fontSize, id);

                let { markup, bb } = textPath;
                svgMarkupBody += textPath.markup

                //add width for total viewBox
                maxWidth = bb.width > maxWidth ? bb.width : maxWidth;

                //single svg
                let singleSvg = `<svg id="fnt-${family}" viewBox="0 0 ${Math.ceil(bb.width + 1)} ${fontSize * 2}" xmlns="http://www.w3.org/2000/svg">` + markup + `</svg>`;

                if (exportSingleFiles) zip.file(`img/${l}/${id}.svg`, singleSvg);

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
                let { family, menu, category, variants, isvf } = item;
                let id = family.toLowerCase().replaceAll(' ', '-')
                let firstLetter = family.substring(0, 1).toLowerCase();


                // add section on letter change
                if (lastLetter != firstLetter) {
                    previewHtmlBody += `</section>
                        <section class="section-letter" id="${firstLetter}">`;
                    //navLetters.insertAdjacentHTML('beforeend', `<li class="li-nav"><a href="#${firstLetter}">${firstLetter}</a></li>`);
                }

                //add to preview list
                previewImgList.push({ family: family, img: `${l}.svg#${id}` });

                let type = isvf ? 'vf' : 'static';
                previewHtmlBody += `
                <figure class="font-item" data-cat="${category}" data-type="${type}" variants="${variants}">
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
        let dir = sampleText ? 'preview_images_' + sampleText : 'preview_images';



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
            formData.append('dir', dir);

            //send to php for file saving
            let res = await fetch('php/save_unzip.php', {
                method: "POST",
                body: formData
            });

        }





        btnDownload.href = await URL.createObjectURL(blob);
        btnDownload.download = 'previews' + '.zip';
        btnDownload.classList.remove('dsp-non');

        let filesize = +(blob.size / 1024 / 1024).toFixed(2);
        let t1 = performance.now();
        let time = +((t1 - t0) / 1000).toFixed(3)


        btnDownload.textContent = `Download preview images ${filesize} MB`;
        processedState.textContent = `Zip is ready! ${time} s`;


        //show preview in iframe
        if (showPreview) {
            articlePreview.classList.remove('dsp-non');
            let rand = Math.floor((Math.random()*1000000)+1);
            let urlPrev = `${dir}/previews.html`+'?id='+rand;
            iframePrev.src = urlPrev;
            linkPreview.href = urlPrev;
        }




    }

})();
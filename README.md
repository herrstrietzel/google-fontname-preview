# google-fontname-preview
Generate static preview SVG images for *all* available google font-family names using in this font.   

Obviously processing thousands of fonts (to this date ~1750) to create a preview image is a tedious task.  

Admittedly, this helper has its limitations but it helps to generate "relatively" compact static preview images displaying the used fonts by generating the optimized scalable vector based images (... uhm SVGs) or webP raster images (in case the geometry is too complex). Besides, it combines images in letter-based sprites to reduce requests.

**Example 2024-07-12/ 1713 fonts**  
Font previews are organized alphabetically:   
You'll end up in 26 sprite SVGs with a total size of ~4.4 MB (uncompressed ~ 1.5 MB gzipped).
(Keep in mind the JSON font list is already ~1.5 MB in file size.)

## Usage
1. Open the [**static github page version**](https://herrstrietzel.github.io/google-fontname-preview/) in your browser. The provided font list is either retrieved from the included JSON cache file or – when entering a valid google font dev API key – via API (resulting in the most up-to-date font list)
2. Download the repo and run it on a local server. If your server supports `php` – the static SVG images are generated and saved to the `preview_images` directory.

## Features: Generate ...
1. preview images either based on a static/cached or an up-to-date (google fonts dev API key required) font list
2. a zipped package using the web-app – "vanilla-JS" **client-side** powered by `jszip` library
3. an array of preview images on local server provided `php` is available – **server-side**


## File output
This helper generates previews:    
* as **`SVG` sprites** – combining multiple font-families in one file per letter: you'll end up with 26 sprite SVG files including all font-family previews. This approach is based on [fragment identifiers](https://css-tricks.com/svg-fragment-identifiers-work/)   


``` 
<img src="o.svg#open-sans">
```
<img src="preview_images/sprites/o.svg#open-sans" alt="open sans" height="50" >

* or as **single (self contained) SVG images**  

``` 
<img src="f/fira-sans.svg">
```
<img src="preview_images/img/f/fira-sans.svg" alt="fira sans" height="50" >

<hr>

### Vector vs. raster image?
When testing the output file sizes, I recognized some "display" font families (e.g "Rubik 80s Fade
") introduce a high bézier complexity eventually resulting in a huge file size when delevered as a native SVG. 

Thats why I decided to switch between vector and rasterized output to find a reasonable balance between  precision and file size (let's remember +1700 fonts)



## Challenges: Get a font preview at least for the font names?  

The list of available fonts via google font API is massive > 1750 fonts.  
Sometimes, you may need to get a simple preview rendering of a specific font-family showing exactly the used font – without parsing the full-fledged font.  

Fortunately, the google font dev API can help:   

If you need to write your own font list application, I highly recommend to obtain a free API key as explained in this official google documentation  [»Acquiring and using an API key«](https://developers.google.com/fonts/docs/developer_api#APIKey)

Now, you can easily `fetch()` a font list in JS like so:   

```
https://www.googleapis.com/webfonts/v1/webfonts?capability=VF&capability=CAPABILITY_UNSPECIFIED&sort=alpha&key=${apiKey}`
```

If we specify the query parameters:  

* `CAPABILITY_UNSPECIFIED` - we get **truetype** resource URLs – this helps for parsing and rendering since we don't need to apply highly complex decompressions as needed for `woff2` (brotli compressed)  
* `capability=VF` - we also get variable font info about design axes




#### Example »Open Sans« (in items): 

```
{
    "family": "Open Sans",
    "variants": [
    "regular",
    "italic"
    ],
    "subsets": [
    "cyrillic",
    "cyrillic-ext",
    "greek",
    "greek-ext",
    "hebrew",
    "latin",
    "latin-ext",
    "math",
    "symbols",
    "vietnamese"
    ],
    "version": "v40",
    "lastModified": "2023-12-14",
    "files": {
    "regular": "https://fonts.gstatic.com/s/opensans/v40/mem8YaGs126MiZpBA-U1UpcaXcl0Aw.ttf",
    "italic": "https://fonts.gstatic.com/s/opensans/v40/mem6YaGs126MiZpBA-UFUJ0ef8xkA76a.ttf"
    },
    "category": "sans-serif",
    "kind": "webfonts#webfont",
    "menu": "https://fonts.gstatic.com/s/opensans/v40/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0B4maVc.ttf",
    "axes": [
    {
        "tag": "wdth",
        "start": 75,
        "end": 100
    },
    {
        "tag": "wght",
        "start": 300,
        "end": 800
    }
    ]
},
```

Most importantly, we can retrieve a relatively lightweight preview  font subset specified in the **menu** property.  
The **menu** link references a subset font file only including the glyphs needed to render the font-family name: In this case "Open Sans". In other words: the truetype font only includes the glyphs: `O,o,p,e,n,S,a,s`


## Dependencies
* [opentype.js](https://github.com/opentypejs/opentype.js)
* [jszip](https://github.com/Stuk/jszip)

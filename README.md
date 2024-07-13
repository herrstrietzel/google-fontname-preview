# google-fontname-preview
Generate static preview SVG images for google font-family names using in this font.  

This helper generates previews:    
* as `SVG` sprites – combining multiple font-families in one file per letter: you'll end up with 26 sprite SVG files including all font-family previews. This approach is based on fragment identifiers  


<img src="preview_images/sprites/o.svg#open-sans" alt="open sans" height="100">


* or as single (self contained) SVG images  


<img src="preview_images/img/fira-sans.svg" alt="fira sans" height="100">


## Challenges: How to get a font preview at least for the font names
The list of available fonts via google font API is massive >1700 fonts.  
Sometimes, you may need to get a simple preview rendering of a specific font-family showing exactly the used font – without parsing the full-fledged font.  

Processing thousands of fonts to generate a preview image is a quite exhausting task.

## How it works 
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

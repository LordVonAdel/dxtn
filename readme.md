# dxtjs
Converts DXT compressed images to RGBA8888 and back.

## Supported formats:
- DXT1 / BC1
- DXT3 / BC2
- DXT5 / BC3

## Example
```js
const DXTN = require('dxtn');

// Get the RGBA8888 data from an array filled with DXT1 data
const rgba8888data = DXTN.decompressDXT1(width, height, rawDXTData);

// Convert RGBA8888 data to an DXT1 array
const dxtData = DXTN.compressDXT1(width, height, rawRGBA8888Data);
```

## License
MIT
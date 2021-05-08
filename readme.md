# dxtjs
Converts DXT compressed images to RGBA8888 and back.

## Supported formats:
- DXT1

## Example
```js
// Get the RGBA8888 data from an array filled with DXT1 data
const rgba8888data = decompressDXT1(width, height, rawDXTData);

// Convert RGBA8888 data to an DXT1 array
const dxtData = compressDXT1(width, height, rawRGBA8888Data);
```

## License
MIT
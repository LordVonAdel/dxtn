module.exports = {
  generateDXT1Lookup(colorValue0, colorValue1, out = null) {
    let color0 = this.getComponentsFromRGB565(colorValue0);
    let color1 = this.getComponentsFromRGB565(colorValue1);

    let lookup = out || new Uint8Array(16);

    if (colorValue0 > colorValue1) {
      // Non transparent mode
      lookup[0] = Math.floor((color0.R) * 255);
      lookup[1] = Math.floor((color0.G) * 255);
      lookup[2] = Math.floor((color0.B) * 255);
      lookup[3] = Math.floor(255);

      lookup[4] = Math.floor((color1.R) * 255);
      lookup[5] = Math.floor((color1.G) * 255);
      lookup[6] = Math.floor((color1.B) * 255);
      lookup[7] = Math.floor(255);

      lookup[8] = Math.floor((color0.R * 2/3 + color1.R * 1/3 ) * 255);
      lookup[9] = Math.floor((color0.G * 2/3 + color1.G * 1/3 ) * 255);
      lookup[10] = Math.floor((color0.B * 2/3 + color1.B * 1/3 ) * 255);
      lookup[11] = Math.floor(255);

      lookup[12] = Math.floor((color0.R * 1/3 + color1.R * 2/3) * 255);
      lookup[13] = Math.floor((color0.G * 1/3 + color1.G * 2/3) * 255);
      lookup[14] = Math.floor((color0.B * 1/3 + color1.B * 2/3) * 255);
      lookup[15] = Math.floor(255);

    } else {
      // transparent mode
      lookup[0] = Math.floor((color0.R) * 255);
      lookup[1] = Math.floor((color0.G) * 255);
      lookup[2] = Math.floor((color0.B) * 255);
      lookup[3] = Math.floor(255);

      lookup[4] = Math.floor((color0.R * 1/2 + color1.R * 1/2 ) * 255);
      lookup[5] = Math.floor((color0.G * 1/2 + color1.G * 1/2 ) * 255);
      lookup[6] = Math.floor((color0.B * 1/2 + color1.B * 1/2 ) * 255);
      lookup[7] = Math.floor(255);

      lookup[08] = Math.floor((color1.R) * 255);
      lookup[09] = Math.floor((color1.G) * 255);
      lookup[10] = Math.floor((color1.B) * 255);
      lookup[11] = Math.floor(255);

      lookup[12] = Math.floor(0);
      lookup[13] = Math.floor(0);
      lookup[14] = Math.floor(0);
      lookup[15] = Math.floor(0);
    }

    return lookup;
  },

  generateDXT5AlphaLookup(alpha0, alpha1, array = null) {
    let alphaLookup = array || new Uint8Array(8);
    alphaLookup[0] = alpha0;
    alphaLookup[1] = alpha1;
    if (alpha0 > alpha1) {
      alphaLookup[2] = Math.round((6 * alpha0 + 1 * alpha1) / 7);
      alphaLookup[3] = Math.round((5 * alpha0 + 2 * alpha1) / 7);
      alphaLookup[4] = Math.round((4 * alpha0 + 3 * alpha1) / 7);
      alphaLookup[5] = Math.round((3 * alpha0 + 4 * alpha1) / 7);
      alphaLookup[6] = Math.round((2 * alpha0 + 5 * alpha1) / 7);
      alphaLookup[7] = Math.round((1 * alpha0 + 6 * alpha1) / 7);
    } else {
      alphaLookup[2] = Math.round((4 * alpha0 + 1 * alpha1) / 5);
      alphaLookup[3] = Math.round((3 * alpha0 + 2 * alpha1) / 5);
      alphaLookup[4] = Math.round((2 * alpha0 + 3 * alpha1) / 5);
      alphaLookup[5] = Math.round((1 * alpha0 + 4 * alpha1) / 5);
      alphaLookup[6] = 0;
      alphaLookup[7] = 255;
    }
    return alphaLookup;
  },

  getError(pixels, block) {
    let error = 0;
    for (let i in pixels) {
      error += Math.abs(pixels[i] - block[i]);
    }
    return error;
  },

  findNearestOnLookup(color, lookup) {
    let minDistance = Infinity;
    let minIndex = 0;

    for (let i = 0; i < lookup.length; i += 4) {
      let deltaR = (color[0] - lookup[i + 0]);
      let deltaG = (color[1] - lookup[i + 1]);
      let deltaB = (color[2] - lookup[i + 2]);
      let deltaA = (color[3] - lookup[i + 3]);
      let distance = deltaR * deltaR + deltaB * deltaB + deltaG * deltaG + deltaA * deltaA;

      if (distance < minDistance) {
        minDistance = distance;
        minIndex = i / 4;
      }
    }

    return minIndex;
  },

  getComponentsFromRGB565(color) {
    return {
      R: ((color & 0b11111000_00000000) >> 8) / 0xff,
      G: ((color & 0b00000111_11100000) >> 3) / 0xff,
      B: ((color & 0b00000000_00011111) << 3) / 0xff
    }
  },

  makeRGB565(r, g, b) {
    return ((r & 0b11111000) << 8) | ((g & 0b11111100) << 3) | ((b & 0b11111000) >> 3);
  },

  shiftColorValue(color, amount) {
    let components = this.getComponentsFromRGB565(color);
    let r = Math.min(Math.max(Math.round(components.r * amount), 0), 1);
    let g = Math.min(Math.max(Math.round(components.r * amount), 0), 1);
    let b = Math.min(Math.max(Math.round(components.r * amount), 0), 1);
    return this.makeRGB565(r, g, b);
  }
}
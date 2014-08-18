var cv = require('opencv');
var gm = require('gm');

var workingDir = process.argv[2], crosswordFile = process.argv[3];

cv.readImage(workingDir + '/' + crosswordFile, function (err, im) {
  var original = im.copy();

  // 1) Seperate clues and grid from image
  im.convertGrayscale();
  im.gaussianBlur();
  im = im.adaptiveThreshold(255,1,0,9,4);
  im.save(workingDir + '/preprocess.jpg');

  // grid is the largest contour
  var maxArea = -1, maxIdx = null;
  var contours = im.findContours();
  for (var i = 0; i < contours.size(); i++) {
    if (contours.area(i) > maxArea && contours.area(i) < im.width()*im.height()/2) {
      maxArea = contours.area(i);
      maxIdx = i;
    }
  }

  var rect = contours.boundingRect(maxIdx);
  console.log(rect);
  gm(workingDir + '/crossword.jpg').crop(rect.width, rect.height, rect.x, rect.y).write(workingDir + '/grid.jpg', function () {});

  // draw white rectangle over grid
  var cluesOnly = original.copy();
  cluesOnly.rectangle([rect.x,rect.y], [rect.width,rect.height], [255,255,255], -1);
  cluesOnly.save(workingDir + '/clues.jpg');

  // 2) Extract columns
  im = cluesOnly;
  im.convertGrayscale();
  im.erode(10);
  im.save(workingDir + '/erode.jpg');

  // clue is a sufficiently large contour
  var minArea = im.width()*im.height()/200;
  var maxArea = im.width()*im.height()/2;
  var contours = im.findContours();
  for (var i = 0; i < contours.size(); i++) {
    if (contours.area(i) > minArea && contours.area(i) < maxArea) {
      var rect = contours.boundingRect(i);
      console.log(rect);
      gm(workingDir + '/clues.jpg').crop(rect.width, rect.height, rect.x, rect.y).write(workingDir + '/crop' + i + '.jpg', function () {});
    }
  }
});

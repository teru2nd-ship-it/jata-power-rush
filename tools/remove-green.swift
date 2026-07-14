import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

guard CommandLine.arguments.count == 3 else {
    fputs("usage: remove-green.swift INPUT OUTPUT\n", stderr)
    exit(2)
}

let inputURL = URL(fileURLWithPath: CommandLine.arguments[1]) as CFURL
let outputURL = URL(fileURLWithPath: CommandLine.arguments[2]) as CFURL

guard
    let source = CGImageSourceCreateWithURL(inputURL, nil),
    let image = CGImageSourceCreateImageAtIndex(source, 0, nil)
else {
    fputs("failed to read input image\n", stderr)
    exit(1)
}

let width = image.width
let height = image.height
let bytesPerRow = width * 4
var pixels = [UInt8](repeating: 0, count: height * bytesPerRow)
let colorSpace = CGColorSpaceCreateDeviceRGB()
let bitmapInfo = CGBitmapInfo.byteOrder32Big.rawValue | CGImageAlphaInfo.premultipliedLast.rawValue

guard let context = CGContext(
    data: &pixels,
    width: width,
    height: height,
    bitsPerComponent: 8,
    bytesPerRow: bytesPerRow,
    space: colorSpace,
    bitmapInfo: bitmapInfo
) else {
    fputs("failed to create bitmap context\n", stderr)
    exit(1)
}

context.draw(image, in: CGRect(x: 0, y: 0, width: width, height: height))

var transparentPixels = 0
var minX = width
var minY = height
var maxX = -1
var maxY = -1
for offset in stride(from: 0, to: pixels.count, by: 4) {
    let red = Int(pixels[offset])
    let green = Int(pixels[offset + 1])
    let blue = Int(pixels[offset + 2])
    let sourceAlpha = Int(pixels[offset + 3])
    let otherMax = max(red, blue)
    let greenLead = green - otherMax

    var alpha = sourceAlpha
    if green > 105 && greenLead > 38 {
        let removal = min(1.0, max(0.0, Double(greenLead - 38) / 95.0))
        alpha = Int(Double(sourceAlpha) * (1.0 - removal))
    }

    var cleanGreen = green
    if greenLead > 10 {
        cleanGreen = min(green, otherMax + 10)
    }

    if alpha <= 2 {
        pixels[offset] = 0
        pixels[offset + 1] = 0
        pixels[offset + 2] = 0
        pixels[offset + 3] = 0
        transparentPixels += 1
    } else {
        pixels[offset] = UInt8(red * alpha / 255)
        pixels[offset + 1] = UInt8(cleanGreen * alpha / 255)
        pixels[offset + 2] = UInt8(blue * alpha / 255)
        pixels[offset + 3] = UInt8(alpha)

        let pixelIndex = offset / 4
        let x = pixelIndex % width
        let y = pixelIndex / width
        minX = min(minX, x)
        minY = min(minY, y)
        maxX = max(maxX, x)
        maxY = max(maxY, y)
    }
}

guard
    let provider = CGDataProvider(data: Data(pixels) as CFData),
    let fullImage = CGImage(
        width: width,
        height: height,
        bitsPerComponent: 8,
        bitsPerPixel: 32,
        bytesPerRow: bytesPerRow,
        space: colorSpace,
        bitmapInfo: CGBitmapInfo(rawValue: bitmapInfo),
        provider: provider,
        decode: nil,
        shouldInterpolate: false,
        intent: .defaultIntent
    )
else {
    fputs("failed to prepare output bitmap\n", stderr)
    exit(1)
}

guard maxX >= minX, maxY >= minY else {
    fputs("no foreground pixels found\n", stderr)
    exit(1)
}

let padding = 24
let cropX = max(0, minX - padding)
let cropY = max(0, minY - padding)
let cropMaxX = min(width - 1, maxX + padding)
let cropMaxY = min(height - 1, maxY + padding)
let cropRect = CGRect(
    x: cropX,
    y: cropY,
    width: cropMaxX - cropX + 1,
    height: cropMaxY - cropY + 1
)

guard
    let outputImage = fullImage.cropping(to: cropRect),
    let destination = CGImageDestinationCreateWithURL(outputURL, UTType.png.identifier as CFString, 1, nil)
else {
    fputs("failed to crop output image\n", stderr)
    exit(1)
}

CGImageDestinationAddImage(destination, outputImage, nil)
guard CGImageDestinationFinalize(destination) else {
    fputs("failed to write output image\n", stderr)
    exit(1)
}

print("wrote \(outputImage.width)x\(outputImage.height) PNG from \(width)x\(height); transparent pixels: \(transparentPixels)")

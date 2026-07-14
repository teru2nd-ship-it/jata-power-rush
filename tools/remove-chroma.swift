import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

guard CommandLine.arguments.count == 3 else {
    fputs("usage: remove-chroma.swift INPUT OUTPUT\n", stderr)
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

let keyRed = Double(pixels[0]) / 255.0
let keyGreen = Double(pixels[1]) / 255.0
let keyBlue = Double(pixels[2]) / 255.0
print("sampled key RGB: \(pixels[0]),\(pixels[1]),\(pixels[2]); alpha: \(pixels[3])")
let transparentDistance = 0.40
let opaqueDistance = 0.86
var minX = width
var minY = height
var maxX = -1
var maxY = -1
var transparentPixels = 0

func clamp(_ value: Double, _ lower: Double, _ upper: Double) -> Double {
    min(upper, max(lower, value))
}

for offset in stride(from: 0, to: pixels.count, by: 4) {
    let red = Double(pixels[offset]) / 255.0
    let green = Double(pixels[offset + 1]) / 255.0
    let blue = Double(pixels[offset + 2]) / 255.0
    let sourceAlpha = Double(pixels[offset + 3]) / 255.0
    let distance = sqrt(
        pow(red - keyRed, 2) +
        pow(green - keyGreen, 2) +
        pow(blue - keyBlue, 2)
    )
    let matte = clamp((distance - transparentDistance) / (opaqueDistance - transparentDistance), 0, 1)
    let alpha = sourceAlpha * matte

    if alpha <= 0.01 {
        pixels[offset] = 0
        pixels[offset + 1] = 0
        pixels[offset + 2] = 0
        pixels[offset + 3] = 0
        transparentPixels += 1
        continue
    }

    var premultipliedRed = clamp(red * sourceAlpha - keyRed * (sourceAlpha - alpha), 0, alpha)
    let premultipliedGreen = clamp(green * sourceAlpha - keyGreen * (sourceAlpha - alpha), 0, alpha)
    var premultipliedBlue = clamp(blue * sourceAlpha - keyBlue * (sourceAlpha - alpha), 0, alpha)
    if premultipliedRed > premultipliedGreen + alpha * 0.08 &&
        premultipliedBlue > premultipliedGreen + alpha * 0.08 {
        premultipliedRed = min(premultipliedRed, premultipliedGreen + alpha * 0.05)
        premultipliedBlue = min(premultipliedBlue, premultipliedGreen + alpha * 0.05)
    }
    pixels[offset] = UInt8((premultipliedRed * 255.0).rounded())
    pixels[offset + 1] = UInt8((premultipliedGreen * 255.0).rounded())
    pixels[offset + 2] = UInt8((premultipliedBlue * 255.0).rounded())
    pixels[offset + 3] = UInt8((alpha * 255.0).rounded())

    let pixelIndex = offset / 4
    let x = pixelIndex % width
    let y = pixelIndex / width
    minX = min(minX, x)
    minY = min(minY, y)
    maxX = max(maxX, x)
    maxY = max(maxY, y)
}

guard maxX >= minX, maxY >= minY else {
    fputs("no foreground pixels found\n", stderr)
    exit(1)
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

print("wrote \(outputImage.width)x\(outputImage.height) PNG; transparent pixels: \(transparentPixels)")

import AppKit
import CoreGraphics

func generateFavicons() {
    let logoPath = "images/logo.png"
    guard let srcImage = NSImage(contentsOfFile: logoPath),
          let tiff = srcImage.tiffRepresentation,
          let srcRep = NSBitmapImageRep(data: tiff) else {
        print("Failed to load \(logoPath)")
        return
    }

    // Exact center in original image: cx = 501.0, cy = 474.5
    // Circle radius: R = 235.0
    // Crop size: 600x600 centered at (501.0, 474.5)
    let size: CGFloat = 600
    let originX: CGFloat = 501.0 - (size / 2.0) // 201.0
    let originY: CGFloat = 474.5 - (size / 2.0) // 174.5

    let colorSpace = CGColorSpaceCreateDeviceRGB()
    let bitmapInfo = CGBitmapInfo(rawValue: CGImageAlphaInfo.premultipliedLast.rawValue)

    guard let ctx = CGContext(data: nil,
                              width: Int(size),
                              height: Int(size),
                              bitsPerComponent: 8,
                              bytesPerRow: Int(size) * 4,
                              space: colorSpace,
                              bitmapInfo: bitmapInfo.rawValue),
          let srcCGImage = srcRep.cgImage else {
        print("Failed to setup context")
        return
    }

    let cropRect = CGRect(x: originX, y: CGFloat(srcRep.pixelsHigh) - originY - size, width: size, height: size)
    guard let croppedCGImage = srcCGImage.cropping(to: cropRect) else {
        print("Failed to crop")
        return
    }

    ctx.draw(croppedCGImage, in: CGRect(x: 0, y: 0, width: size, height: size))

    guard let pixelData = ctx.data else {
        print("No pixel data")
        return
    }

    let ptr = pixelData.bindMemory(to: UInt8.self, capacity: Int(size * size * 4))
    let w = Int(size)
    let h = Int(size)

    let cx = 300.0
    let cy = 300.0
    let radius = 235.0

    for y in 0..<h {
        let dy = Double(y) - cy
        for x in 0..<w {
            let dx = Double(x) - cx
            let dist = sqrt(dx*dx + dy*dy)
            let offset = (y * w + x) * 4

            let r = Double(ptr[offset])
            let g = Double(ptr[offset + 1])
            let b = Double(ptr[offset + 2])

            let minC = min(r, min(g, b))
            let maxC = max(r, max(g, b))
            let diff = maxC - minC

            if dist > radius {
                // Outside the globe circle: ONLY the solid blue/silver wings of the W belong here!
                // The wings are within abs(dx) <= 298 and dy in [-25, 85].
                // The blue wing color has low brightness (minC < 80) and blue tint (b > r + 15).
                // Silver bevel on wing has diff < 20 and minC < 160.
                let inWingBounds = (abs(dx) <= 298.0) && (dy >= -25.0 && dy <= 85.0)
                let isWingBlue = (b > r + 15.0) && (minC < 85.0)
                let isWingSilver = (diff < 22.0) && (minC < 160.0) && (minC > 60.0)

                if inWingBounds && (isWingBlue || isWingSilver) {
                    // It is part of the wing!
                    // If near outer edge of wing, feather slightly
                    if abs(dx) > 294.0 {
                        let factor = (298.0 - abs(dx)) / 4.0
                        let a = Double(ptr[offset + 3])
                        ptr[offset + 3] = UInt8(clamping: Int(a * max(0.0, factor)))
                    }
                } else {
                    // Transparent! (No light blue shadow, no paper, no reflection)
                    ptr[offset + 3] = 0
                }
            } else {
                // Inside the circle:
                // Remove paper background: off-white paper has minC > 185 and low saturation (diff < 26)
                if minC > 185.0 && diff < 26.0 {
                    if minC >= 218.0 {
                        ptr[offset + 3] = 0
                    } else {
                        let factor = (218.0 - minC) / 33.0
                        let a = Double(ptr[offset + 3])
                        ptr[offset + 3] = UInt8(clamping: Int(a * factor))
                    }
                } else if dist > 230.0 {
                    // Feather boundary of circle
                    let factor = (radius - dist) / 5.0
                    let a = Double(ptr[offset + 3])
                    ptr[offset + 3] = UInt8(clamping: Int(a * max(0.0, factor)))
                }
            }
        }
    }

    guard let transparentCGImage = ctx.makeImage() else {
        print("Failed to create transparent CGImage")
        return
    }

    let masterImage = NSImage(cgImage: transparentCGImage, size: NSSize(width: size, height: size))

    func savePNG(image: NSImage, targetSize: Int, path: String) {
        let rep = NSBitmapImageRep(bitmapDataPlanes: nil,
                                   pixelsWide: targetSize,
                                   pixelsHigh: targetSize,
                                   bitsPerSample: 8,
                                   samplesPerPixel: 4,
                                   hasAlpha: true,
                                   isPlanar: false,
                                   colorSpaceName: .deviceRGB,
                                   bytesPerRow: targetSize * 4,
                                   bitsPerPixel: 32)!
        rep.size = NSSize(width: targetSize, height: targetSize)
        NSGraphicsContext.saveGraphicsState()
        NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
        NSGraphicsContext.current?.imageInterpolation = .high
        image.draw(in: NSRect(x: 0, y: 0, width: targetSize, height: targetSize),
                   from: NSRect(x: 0, y: 0, width: size, height: size),
                   operation: .copy,
                   fraction: 1.0)
        NSGraphicsContext.restoreGraphicsState()

        if let pngData = rep.representation(using: .png, properties: [:]) {
            let dir = (path as NSString).deletingLastPathComponent
            try? FileManager.default.createDirectory(atPath: dir, withIntermediateDirectories: true, attributes: nil)
            try? pngData.write(to: URL(fileURLWithPath: path))
            print("Successfully written \(path)")
        }
    }

    let targets: [(Int, [String])] = [
        (32, ["icon/favicon-32x32.png", "dist/icon/favicon-32x32.png", "favicon-32x32.png"]),
        (96, ["icon/favicon-96x96.png", "dist/icon/favicon-96x96.png", "favicon-96x96.png"]),
        (57, ["icon/apple-icon-57x57.png", "dist/icon/apple-icon-57x57.png"]),
        (114, ["icon/apple-icon-114x114.png", "dist/icon/apple-icon-114x114.png"]),
        (180, ["icon/apple-touch-icon.png", "dist/icon/apple-touch-icon.png"]),
        (192, ["icon/favicon-192x192.png", "dist/icon/favicon-192x192.png"]),
        (512, ["images/sirg-logo-icon.png", "dist/images/sirg-logo-icon.png", "icon/favicon-512x512.png", "dist/icon/favicon-512x512.png"])
    ]

    for (dim, paths) in targets {
        for p in paths {
            savePNG(image: masterImage, targetSize: dim, path: p)
        }
    }

    if let data = try? Data(contentsOf: URL(fileURLWithPath: "icon/favicon-32x32.png")) {
        try? data.write(to: URL(fileURLWithPath: "favicon.ico"))
        try? data.write(to: URL(fileURLWithPath: "dist/favicon.ico"))
        print("Successfully written favicon.ico")
    }
}

generateFavicons()

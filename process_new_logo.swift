import AppKit
import CoreGraphics

func processNewLogo() {
    let inputPath = "/Users/anupriyanshu/.gemini/antigravity-ide/brain/c53863c9-2a00-4273-a350-476f52770935/.user_uploaded/media_1789141583824.png"
    guard let srcImage = NSImage(contentsOfFile: inputPath),
          let tiff = srcImage.tiffRepresentation,
          let srcRep = NSBitmapImageRep(data: tiff) else {
        print("Failed to load \(inputPath)")
        return
    }

    let srcW = srcRep.pixelsWide
    let srcH = srcRep.pixelsHigh
    print("Source image: \(srcW)x\(srcH)")

    // Clean Logo bounds: minX=109, maxX=882, minY=66, maxY=341
    // Padding: 20px
    let padX: CGFloat = 20
    let padY: CGFloat = 16
    let cropX = max(0, CGFloat(109) - padX)
    let cropY = max(0, CGFloat(66) - padY)
    let cropW = min(CGFloat(srcW) - cropX, CGFloat(882 - 109) + padX * 2)
    let cropH = min(CGFloat(srcH) - cropY, CGFloat(341 - 66) + padY * 2)

    let colorSpace = CGColorSpaceCreateDeviceRGB()
    let bitmapInfo = CGBitmapInfo(rawValue: CGImageAlphaInfo.premultipliedLast.rawValue)

    guard let ctx = CGContext(data: nil,
                              width: Int(cropW),
                              height: Int(cropH),
                              bitsPerComponent: 8,
                              bytesPerRow: Int(cropW) * 4,
                              space: colorSpace,
                              bitmapInfo: bitmapInfo.rawValue),
          let srcCG = srcRep.cgImage else {
        print("Failed to create context")
        return
    }

    // In CGContext, Y is inverted (0 at bottom)
    let cgCropRect = CGRect(x: cropX, y: CGFloat(srcH) - cropY - cropH, width: cropW, height: cropH)
    guard let cropped = srcCG.cropping(to: cgCropRect) else {
        print("Failed to crop logo")
        return
    }

    ctx.draw(cropped, in: CGRect(x: 0, y: 0, width: cropW, height: cropH))

    guard let pixelData = ctx.data else {
        print("No pixel data")
        return
    }

    let ptr = pixelData.bindMemory(to: UInt8.self, capacity: Int(cropW * cropH * 4))
    let totalPixels = Int(cropW * cropH)

    // Make paper texture transparent while keeping shadows and metallic 3D relief
    for i in 0..<totalPixels {
        let offset = i * 4
        let r = Double(ptr[offset])
        let g = Double(ptr[offset + 1])
        let b = Double(ptr[offset + 2])

        let minC = min(r, min(g, b))
        let maxC = max(r, max(g, b))
        let diff = maxC - minC

        // Paper texture has high brightness (minC > 200) and low saturation (diff < 26)
        if minC > 195.0 && diff < 26.0 {
            if minC >= 232.0 {
                ptr[offset + 3] = 0 // Transparent
            } else {
                let factor = (232.0 - minC) / 37.0
                let a = Double(ptr[offset + 3])
                ptr[offset + 3] = UInt8(clamping: Int(a * factor))
            }
        }
    }

    guard let transparentLogoCG = ctx.makeImage() else {
        print("Failed to make transparent logo")
        return
    }

    let transparentLogo = NSImage(cgImage: transparentLogoCG, size: NSSize(width: cropW, height: cropH))

    // Helper to save image
    func saveImage(image: NSImage, path: String, isJPEG: Bool = false) {
        let rep = NSBitmapImageRep(bitmapDataPlanes: nil,
                                   pixelsWide: Int(image.size.width),
                                   pixelsHigh: Int(image.size.height),
                                   bitsPerSample: 8,
                                   samplesPerPixel: 4,
                                   hasAlpha: true,
                                   isPlanar: false,
                                   colorSpaceName: .deviceRGB,
                                   bytesPerRow: Int(image.size.width) * 4,
                                   bitsPerPixel: 32)!
        rep.size = image.size
        NSGraphicsContext.saveGraphicsState()
        NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
        NSGraphicsContext.current?.imageInterpolation = .high
        image.draw(in: NSRect(origin: .zero, size: image.size))
        NSGraphicsContext.restoreGraphicsState()

        let dir = (path as NSString).deletingLastPathComponent
        try? FileManager.default.createDirectory(atPath: dir, withIntermediateDirectories: true, attributes: nil)

        if isJPEG {
            // White background for JPEG
            let whiteRep = NSBitmapImageRep(bitmapDataPlanes: nil,
                                           pixelsWide: Int(image.size.width),
                                           pixelsHigh: Int(image.size.height),
                                           bitsPerSample: 8,
                                           samplesPerPixel: 3,
                                           hasAlpha: false,
                                           isPlanar: false,
                                           colorSpaceName: .deviceRGB,
                                           bytesPerRow: Int(image.size.width) * 4,
                                           bitsPerPixel: 32)!
            whiteRep.size = image.size
            NSGraphicsContext.saveGraphicsState()
            NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: whiteRep)
            NSColor.white.setFill()
            NSRect(origin: .zero, size: image.size).fill()
            image.draw(in: NSRect(origin: .zero, size: image.size))
            NSGraphicsContext.restoreGraphicsState()

            if let data = whiteRep.representation(using: .jpeg, properties: [.compressionFactor: 0.95]) {
                try? data.write(to: URL(fileURLWithPath: path))
                print("Saved JPEG: \(path)")
            }
        } else {
            if let data = rep.representation(using: .png, properties: [:]) {
                try? data.write(to: URL(fileURLWithPath: path))
                print("Saved PNG: \(path)")
            }
        }
    }

    // Save main website logos
    saveImage(image: transparentLogo, path: "images/logo.png")
    saveImage(image: transparentLogo, path: "dist/images/logo.png")
    saveImage(image: transparentLogo, path: "images/logo.jpeg", isJPEG: true)
    saveImage(image: transparentLogo, path: "dist/images/logo.jpeg", isJPEG: true)

    // ==========================================
    // Extract Emblem For Favicon & Icons
    // ==========================================
    // Clean Emblem bounds: minX=109, maxX=399 (width 290), minY=66, maxY=341 (height 275)
    // Center of emblem in source: cx = 254.0, cy = 203.5
    let eSize: CGFloat = 320
    let eOriginX = 254.0 - (eSize / 2.0) // 94.0
    let eOriginY = 203.5 - (eSize / 2.0) // 43.5

    guard let eCtx = CGContext(data: nil,
                               width: Int(eSize),
                               height: Int(eSize),
                               bitsPerComponent: 8,
                               bytesPerRow: Int(eSize) * 4,
                               space: colorSpace,
                               bitmapInfo: bitmapInfo.rawValue) else {
        print("Failed to create emblem context")
        return
    }

    let eCropRect = CGRect(x: eOriginX, y: CGFloat(srcH) - eOriginY - eSize, width: eSize, height: eSize)
    if let eCropped = srcCG.cropping(to: eCropRect) {
        eCtx.draw(eCropped, in: CGRect(x: 0, y: 0, width: eSize, height: eSize))

        if let ePixelData = eCtx.data {
            let ePtr = ePixelData.bindMemory(to: UInt8.self, capacity: Int(eSize * eSize * 4))
            let eW = Int(eSize)
            let eH = Int(eSize)
            let ecx = 160.0
            let ecy = 160.0
            let radius = 138.0

            for y in 0..<eH {
                let dy = Double(y) - ecy
                for x in 0..<eW {
                    let dx = Double(x) - ecx
                    let dist = sqrt(dx*dx + dy*dy)
                    let offset = (y * eW + x) * 4

                    let r = Double(ePtr[offset])
                    let g = Double(ePtr[offset + 1])
                    let b = Double(ePtr[offset + 2])

                    let minC = min(r, min(g, b))
                    let maxC = max(r, max(g, b))
                    let diff = maxC - minC

                    // Circle or W wing
                    let inCircle = dist <= radius
                    let inWing = (abs(dx) <= 152.0) && (dy >= -20.0 && dy <= 55.0)

                    if !inCircle && !inWing {
                        ePtr[offset + 3] = 0
                        continue
                    }

                    // Remove paper background
                    if minC > 185.0 && diff < 26.0 {
                        if minC >= 220.0 {
                            ePtr[offset + 3] = 0
                        } else {
                            let factor = (220.0 - minC) / 35.0
                            let a = Double(ePtr[offset + 3])
                            ePtr[offset + 3] = UInt8(clamping: Int(a * factor))
                        }
                    } else if inCircle && dist > 134.0 && !inWing {
                        let factor = (radius - dist) / 4.0
                        let a = Double(ePtr[offset + 3])
                        ePtr[offset + 3] = UInt8(clamping: Int(a * max(0.0, factor)))
                    } else if inWing && abs(dx) > 148.0 {
                        let factor = (152.0 - abs(dx)) / 4.0
                        let a = Double(ePtr[offset + 3])
                        ePtr[offset + 3] = UInt8(clamping: Int(a * max(0.0, factor)))
                    }
                }
            }

            if let transEmblemCG = eCtx.makeImage() {
                let emblemImg = NSImage(cgImage: transEmblemCG, size: NSSize(width: eSize, height: eSize))

                func saveFaviconPNG(image: NSImage, targetDim: Int, path: String) {
                    let rep = NSBitmapImageRep(bitmapDataPlanes: nil,
                                               pixelsWide: targetDim,
                                               pixelsHigh: targetDim,
                                               bitsPerSample: 8,
                                               samplesPerPixel: 4,
                                               hasAlpha: true,
                                               isPlanar: false,
                                               colorSpaceName: .deviceRGB,
                                               bytesPerRow: targetDim * 4,
                                               bitsPerPixel: 32)!
                    rep.size = NSSize(width: targetDim, height: targetDim)
                    NSGraphicsContext.saveGraphicsState()
                    NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
                    NSGraphicsContext.current?.imageInterpolation = .high
                    image.draw(in: NSRect(x: 0, y: 0, width: targetDim, height: targetDim),
                               from: NSRect(x: 0, y: 0, width: eSize, height: eSize),
                               operation: .copy,
                               fraction: 1.0)
                    NSGraphicsContext.restoreGraphicsState()

                    if let data = rep.representation(using: .png, properties: [:]) {
                        let dir = (path as NSString).deletingLastPathComponent
                        try? FileManager.default.createDirectory(atPath: dir, withIntermediateDirectories: true, attributes: nil)
                        try? data.write(to: URL(fileURLWithPath: path))
                        print("Saved Favicon: \(path) (\(targetDim)x\(targetDim))")
                    }
                }

                let iconTargets: [(Int, [String])] = [
                    (32, ["icon/favicon-32x32.png", "dist/icon/favicon-32x32.png", "favicon-32x32.png"]),
                    (96, ["icon/favicon-96x96.png", "dist/icon/favicon-96x96.png", "favicon-96x96.png"]),
                    (57, ["icon/apple-icon-57x57.png", "dist/icon/apple-icon-57x57.png"]),
                    (114, ["icon/apple-icon-114x114.png", "dist/icon/apple-icon-114x114.png"]),
                    (180, ["icon/apple-touch-icon.png", "dist/icon/apple-touch-icon.png"]),
                    (192, ["icon/favicon-192x192.png", "dist/icon/favicon-192x192.png"]),
                    (512, ["images/sirg-logo-icon.png", "dist/images/sirg-logo-icon.png", "icon/favicon-512x512.png", "dist/icon/favicon-512x512.png"])
                ]

                for (dim, paths) in iconTargets {
                    for p in paths {
                        saveFaviconPNG(image: emblemImg, targetDim: dim, path: p)
                    }
                }

                if let data = try? Data(contentsOf: URL(fileURLWithPath: "icon/favicon-32x32.png")) {
                    try? data.write(to: URL(fileURLWithPath: "favicon.ico"))
                    try? data.write(to: URL(fileURLWithPath: "dist/favicon.ico"))
                    print("Saved favicon.ico")
                }
            }
        }
    }
}

processNewLogo()

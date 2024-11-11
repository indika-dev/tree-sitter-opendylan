// swift-tools-version:5.3
import PackageDescription

let package = Package(
    name: "TreeSitterOpendylan",
    products: [
        .library(name: "TreeSitterOpendylan", targets: ["TreeSitterOpendylan"]),
    ],
    dependencies: [
        .package(url: "https://github.com/ChimeHQ/SwiftTreeSitter", from: "0.8.0"),
    ],
    targets: [
        .target(
            name: "TreeSitterOpendylan",
            dependencies: [],
            path: ".",
            sources: [
                "src/parser.c",
                // NOTE: if your language has an external scanner, add it here.
            ],
            resources: [
                .copy("queries")
            ],
            publicHeadersPath: "bindings/swift",
            cSettings: [.headerSearchPath("src")]
        ),
        .testTarget(
            name: "TreeSitterOpendylanTests",
            dependencies: [
                "SwiftTreeSitter",
                "TreeSitterOpendylan",
            ],
            path: "bindings/swift/TreeSitterOpendylanTests"
        )
    ],
    cLanguageStandard: .c11
)

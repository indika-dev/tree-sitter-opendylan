import XCTest
import SwiftTreeSitter
import TreeSitterOpendylan

final class TreeSitterOpendylanTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_opendylan())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Opendylan grammar")
    }
}

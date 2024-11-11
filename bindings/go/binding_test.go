package tree_sitter_opendylan_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_opendylan "github.com/indika-dev/tree-sitter-opendylan/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_opendylan.Language())
	if language == nil {
		t.Errorf("Error loading Opendylan grammar")
	}
}

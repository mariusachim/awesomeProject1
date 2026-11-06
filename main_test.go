package main

import (
	"io"
	"os"
	"testing"
)

func TestProgramOutput(t *testing.T) {
	// given
	r, w, err := os.Pipe()
	if err != nil {
		t.Fatal(err)
	}
	stdout := os.Stdout
	os.Stdout = w
	t.Cleanup(func() { os.Stdout = stdout })

	// when
	main()
	w.Close()
	got, err := io.ReadAll(r)
	if err != nil {
		t.Fatal(err)
	}

	// then
	want := "Hello and welcome, gopher!\ni = 100\ni = 50\ni = 33\ni = 25\ni = 20\n"
	if string(got) != want {
		t.Errorf("output = %q, want %q", got, want)
	}
}

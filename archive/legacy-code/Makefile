SHELL := /bin/sh
.PHONY: all webp responsive placeholders

all: webp responsive placeholders

webp:
	python tools/png_to_webp.py

responsive:
	python tools/generate_responsive.py

placeholders:
	python tools/generate_placeholders.py

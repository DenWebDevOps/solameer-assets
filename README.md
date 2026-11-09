# solameer-assets

Static assets (scripts, video, images) for the Solameer website, served through jsDelivr:

    https://cdn.jsdelivr.net/gh/DenWebDevOps/solameer-assets@<tag>/v/<version>/<file>

Every folder under `v/` is a versioned, never-changing set of files: a change goes into a new folder, and pages point at it. Each release is a git tag (1.0.0, 1.1.0, …), so a URL with a tag is cached for good.

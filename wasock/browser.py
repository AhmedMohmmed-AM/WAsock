class Browser:
    def __init__(platform, browser):
        return [platform, browser, ""]

    def macOS(browser):
        return ["macos", browser, ""]

    def windows(browser):
        return ["windows", browser, ""]

    def ubuntu(browser):
        return ["ubuntu", browser, ""]
module.exports = {
    apps: [
        {
            name: "tourview-api",
            script: "npx",
            args: "directus start",
            env: {
                CONFIG_PATH: ".env.production",
            }
        }
    ]
}
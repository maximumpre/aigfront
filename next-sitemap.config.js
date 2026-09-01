/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || "https://aig.wealthcareportal.com",
  generateRobotsTxt: true, // (optional)
  // ...other options

  exclude: ["/admin/*", "/login", "/register"], // Exclude specific paths from the sitemap
  robotsTxtOptions: {
    policies: [
      {
        disallow: "*",
      },
    ],
  },
};

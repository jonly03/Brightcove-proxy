import "dotenv/config"; // Load environment variables immediately
import fetch from "node-fetch";

class BrightcoveHelper {
  static accessToken = null;
  static tokenExpirationTime = 0;
  static clientId = process.env.BRIGHTCOVE_CLIENT_ID;
  static clientSecret = process.env.BRIGHTCOVE_CLIENT_SECRET;
  static accountId = process.env.BRIGHTCOVE_ACCOUNT_ID;
  static brightcoveBaseUrl = "https://cms.api.brightcove.com/v1/accounts/";

  static async getAccessToken() {
    const currentTime = Math.floor(Date.now() / 1000);

    if (this.accessToken && this.tokenExpirationTime > currentTime) {
      return this.accessToken;
    }

    const authString = Buffer.from(
      `${this.clientId}:${this.clientSecret}`
    ).toString("base64");

    const url =
      "https://oauth.brightcove.com/v4/access_token?grant_type=client_credentials";

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Basic ${authString}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      if (!response.ok) {
        console.log(response);

        throw new Error(`Failed to fetch access token: ${response.statusText}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpirationTime = currentTime + data.expires_in;

      return this.accessToken;
    } catch (error) {
      console.error("Error fetching access token:", error.message);
      throw error;
    }
  }

  static async getVideos({
    limit = 100,
    id = null,
    searchTerm = null,
    hasTextTracks = false,
  }) {
    try {
      const token = await this.getAccessToken();
      let url = `${this.brightcoveBaseUrl}${this.accountId}`;

      if (id) {
        url += `/videos/${id}`;
      } else {
        url += `/videos?limit=${limit}`;
        let queryString = "";
        if (searchTerm) {
          queryString = encodeURIComponent(`(+text:${searchTerm})`);
        }

        if (hasTextTracks === "true") {
          queryString += encodeURIComponent(
            ` AND (+has_text_tracks:${hasTextTracks})`
          );
        }

        url += `&query=${queryString}`;
        url += `&sort=-created_at`;
      }
      console.log("Fetching videos from URL:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch videos: ${response.statusText}`);
      }

      const videos = await response.json();
      return videos;
    } catch (error) {
      console.error("Error fetching videos:", error.message);
      throw error;
    }
  }
}

export default BrightcoveHelper;

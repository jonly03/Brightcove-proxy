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
    filters,
  }) {
    try {
      const token = await this.getAccessToken();
      let url = `${this.brightcoveBaseUrl}${this.accountId}`;

      if (id) {
        url += `/videos/${id}`;
      } else {
        url += `/videos?limit=${limit}`;
        let queryString = "";
        const {
          searchByDescription,
          searchByName,
          searchByTags,
          hasTextTracks,
        } = filters;

        if (searchTerm && searchTerm.length > 0) {
          if (searchByDescription || searchByName || searchByTags) {
            if (searchByTags && searchByTags === "true") {
              // TODO: Eventually rip up to search for tags in addition other fields

              // searchTerm is a comma seprated list of tags
              // example: "tag1,tag2,tag3"
              // Transform searchTeam to wrap each tag in quotes and keep the commas
              // example: "'tag1','tag2','tag3'"
              // const tags = searchTerm.split(",");
              // const tagsString = tags.map((tag) => tag.trim()).join(",");
              let tagsString = "";
              searchTerm.split(",").forEach((tag) => {
                if (tag.length > 0 && tagsString.length > 0) {
                  tagsString += ",";
                }
                if (tag.length > 0) {
                  tagsString += `"${tag.trim()}"`;
                }
              });

              console.log("Tags string:", tagsString);

              queryString += encodeURIComponent(`(+tags:${tagsString})`);

              // queryString += encodeURIComponent(`(+tags:${searchTerm})`);
            } else {
              if (
                searchByName &&
                searchByName === "true" &&
                searchByDescription &&
                searchByDescription === "true"
              ) {
                queryString = encodeURIComponent(`(+text:${searchTerm})`);
              } else if (searchByName && searchByName === "true") {
                queryString += encodeURIComponent(`(+name:${searchTerm})`);
              } else if (
                searchByDescription &&
                searchByDescription === "true"
              ) {
                queryString += encodeURIComponent(
                  `(+description:${searchTerm})`
                );
              }
            }
          } else {
            queryString = encodeURIComponent(`(+text:${searchTerm})`);
          }
        }

        if (hasTextTracks === "true") {
          if (queryString.length > 0) {
            queryString += encodeURIComponent(" AND ");
          }
          queryString += encodeURIComponent(
            `(+has_text_tracks:${hasTextTracks})`
          );
        }

        if (queryString.length > 0) {
          url += `&query=${queryString}`;
        }

        // Let Brightcove automaticaly handle sorting by relevance when there is a search term or by created_at when there is no search term
        url += `&sort=-updated_at`;
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

      let videos = await response.json();

      if (filters && filters.hasDescription === "true") {
        videos = videos.filter(
          (video) => video.description || video.long_description
        );
      }

      return videos;
    } catch (error) {
      console.error("Error fetching videos:", error.message);
      throw error;
    }
  }
}

export default BrightcoveHelper;

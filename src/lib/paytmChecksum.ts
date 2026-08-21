import crypto from "crypto";

export class PaytmChecksum {
  private static iv = "@@@@&&&&####$$$$";

  static encrypt(input: string, key: string): string {
    const cipher = crypto.createCipheriv("aes-128-cbc", key, this.iv);
    let encrypted = cipher.update(input, "binary", "base64");
    encrypted += cipher.final("base64");
    return encrypted;
  }

  static decrypt(encrypted: string, key: string): string {
    const decipher = crypto.createDecipheriv("aes-128-cbc", key, this.iv);
    let decrypted = decipher.update(encrypted, "base64", "binary");
    try {
      decrypted += decipher.final("binary");
    } catch (e) {
      console.error("Decryption error:", e);
    }
    return decrypted;
  }

  static async generateSignature(params: any, key: string): Promise<string> {
    if (typeof params !== "object" && typeof params !== "string") {
      const error = "string or object expected, " + typeof params + " given.";
      return Promise.reject(error);
    }
    if (typeof params !== "string") {
      params = this.getStringByParams(params);
    }
    return this.generateSignatureByString(params, key);
  }

  static verifySignature(params: any, key: string, checksum: string): boolean {
    if (typeof params !== "object" && typeof params !== "string") {
      return false;
    }
    if (typeof params !== "string") {
      params = this.getStringByParams(params);
    }
    return this.verifySignatureByString(params, key, checksum);
  }

  private static async generateSignatureByString(params: string, key: string): Promise<string> {
    const salt = await this.generateRandomString(4);
    return this.calculateChecksum(params, key, salt);
  }

  private static verifySignatureByString(params: string, key: string, checksum: string): boolean {
    const paytm_hash = this.decrypt(checksum, key);
    const salt = paytm_hash.substring(paytm_hash.length - 4);
    return paytm_hash === this.calculateHash(params, salt);
  }

  private static generateRandomString(length: number): Promise<string> {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(length * 3.08, (err, buf) => {
        if (!err) {
          const salt = buf.toString("base64").substring(0, length);
          resolve(salt);
        } else {
          reject(err);
        }
      });
    });
  }

  private static getStringByParams(params: Record<string, any>): string {
    const data: Record<string, any> = {};
    Object.keys(params)
      .sort()
      .forEach((key) => {
        data[key] =
          params[key] !== null && params[key] !== undefined && params[key].toString().toLowerCase() !== "null"
            ? params[key]
            : "";
      });
    return Object.values(data).join("|");
  }

  private static calculateHash(params: string, salt: string): string {
    const finalString = params + "|" + salt;
    return crypto.createHash("sha256").update(finalString).digest("hex") + salt;
  }

  private static calculateChecksum(params: string, key: string, salt: string): string {
    const hashString = this.calculateHash(params, salt);
    return this.encrypt(hashString, key);
  }
}

export default PaytmChecksum;

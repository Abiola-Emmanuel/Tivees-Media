declare module "jsonwebtoken/decode" {
  import type { DecodeOptions, Jwt, JwtPayload } from "jsonwebtoken";

  export default function decode(
    token: string,
    options: DecodeOptions & { complete: true },
  ): null | Jwt;
  export default function decode(
    token: string,
    options: DecodeOptions & { json: true },
  ): null | JwtPayload;
  export default function decode(
    token: string,
    options?: DecodeOptions,
  ): null | JwtPayload | string;
}

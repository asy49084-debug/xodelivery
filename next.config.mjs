const nextConfig = {
  async rewrites() {
    return [{ source: "/:path*", destination: "/" }];
  },
};
export default nextConfig;

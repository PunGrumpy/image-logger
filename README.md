# `🖼️` Image Logger

## 📝 Description

This is a simple image logger that logs images to a file and sending them to a discord webhook.

## 📚 How to use

### 📦 Requirements

- Node.js v20.0.0 or higher
- NPM v7.0.0 or higher
- PNPM v6.0.0 or higher

### 📥 Installation

```bash
pnpm install
```

### ⚙️ Configuration

Create a `config.json` you can use the `config.example.json` as a template.

```json
{
  "webhooks": [
    {
      "name": "NAME OF WEBHOOK",
      "url": "URL OF WEBHOOK"
    }
  ],
  "image": [
    {
      "name": "NAME OF IMAGE",
      "url": "URL OF IMAGE or PATH TO IMAGE"
    },
    {
      "name": "NAME OF IMAGE",
      "url": "URL OF IMAGE or PATH TO IMAGE"
    }
  ]
}
```

### 🚀 Starting

### 🐳 Docker

```bash
docker compose up -d
```

### 🖥️ Local

```bash
pnpm start
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

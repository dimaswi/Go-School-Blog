# Build stage
FROM golang:1.26-alpine AS builder

# Set working directory
WORKDIR /app

# Install git and build dependencies
RUN apk add --no-cache git tzdata

# Copy go mod and sum files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy the source code
COPY . .

# Build the application statically
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-w -s" -o api ./cmd/api/main.go

# Final stage
FROM alpine:3.19

# Set working directory
WORKDIR /app

# Add timezone data and ca-certificates
RUN apk add --no-cache tzdata ca-certificates

# Copy the binary from the builder stage
COPY --from=builder /app/api .

# Create necessary directories
RUN mkdir -p uploads/images

# Expose port 8080
EXPOSE 8080

# Set environment variables for memory limit optimization (Go garbage collector)
ENV GOMEMLIMIT=100MiB
ENV GOGC=50

# Run the binary
CMD ["./api"]

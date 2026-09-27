import ExpoModulesCore
import PhotosUI
import UniformTypeIdentifiers

public class MemoryUploadModule: Module {
  private var operation: MemoryUploadOperation?

  public func definition() -> ModuleDefinition {
    Name("BeautilyzeMemoryUpload")
    AsyncFunction("pickAndAnalyze") { (serverUrl: String, promise: Promise) in
      guard self.operation == nil else {
        promise.reject("BUSY", "A photo selection is already in progress.")
        return
      }
      guard let url = URL(string: serverUrl), url.scheme == "https",
            url.host != nil, url.user == nil, url.password == nil,
            let presenter = self.appContext?.utilities?.currentViewController() else {
        promise.reject("PICKER_UNAVAILABLE", "Photo selection needs an HTTPS server and an active app.")
        return
      }
      let operation = MemoryUploadOperation(endpoint: url.appendingPathComponent("analyze")) { result in
        DispatchQueue.main.async {
          self.operation = nil
          switch result {
          case .success(let json): promise.resolve(json)
          case .failure:
            promise.reject("UPLOAD_FAILED", "Could not analyze this photo. Choose a JPEG or PNG under 5 MB and check the server connection.")
          }
        }
      }
      self.operation = operation
      var configuration = PHPickerConfiguration()
      configuration.filter = .images
      configuration.selectionLimit = 1
      configuration.preferredAssetRepresentationMode = .current
      let picker = PHPickerViewController(configuration: configuration)
      picker.delegate = operation
      presenter.present(picker, animated: true)
    }.runOnQueue(.main)
  }
}

private final class MemoryUploadOperation: NSObject, PHPickerViewControllerDelegate, URLSessionTaskDelegate {
  private let endpoint: URL
  private let completion: (Result<String?, Error>) -> Void
  private let maxBytes = 5 * 1024 * 1024

  init(endpoint: URL, completion: @escaping (Result<String?, Error>) -> Void) {
    self.endpoint = endpoint
    self.completion = completion
  }

  func picker(_ picker: PHPickerViewController, didFinishPicking results: [PHPickerResult]) {
    picker.dismiss(animated: true)
    guard let provider = results.first?.itemProvider else {
      completion(.success(nil))
      return
    }
    let type = [UTType.jpeg, UTType.png].first { provider.hasItemConformingToTypeIdentifier($0.identifier) }
    guard let type = type else { fail(); return }
    // Request bytes, never a file representation or a temporary file URL.
    provider.loadDataRepresentation(forTypeIdentifier: type.identifier) { data, error in
      guard error == nil, let data = data, !data.isEmpty, data.count <= self.maxBytes else {
        self.fail()
        return
      }
      self.upload(data, mime: type.preferredMIMEType ?? "image/jpeg")
    }
  }

  private func upload(_ image: Data, mime: String) {
    let boundary = UUID().uuidString
    var body = Data("--\(boundary)\r\nContent-Disposition: form-data; name=\"file\"; filename=\"image\"\r\nContent-Type: \(mime)\r\n\r\n".utf8)
    body.append(image)
    body.append(Data("\r\n--\(boundary)--\r\n".utf8))
    var request = URLRequest(url: endpoint)
    request.httpMethod = "POST"
    request.httpBody = body
    request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
    request.setValue("no-store", forHTTPHeaderField: "Cache-Control")
    let configuration = URLSessionConfiguration.ephemeral
    configuration.urlCache = nil
    configuration.httpCookieStorage = nil
    configuration.urlCredentialStorage = nil
    let session = URLSession(configuration: configuration, delegate: self, delegateQueue: nil)
    session.dataTask(with: request) { data, response, error in
      defer { session.finishTasksAndInvalidate() }
      guard error == nil, let response = response as? HTTPURLResponse,
            (200...299).contains(response.statusCode), let data = data,
            let json = String(data: data, encoding: .utf8) else {
        self.fail()
        return
      }
      self.completion(.success(json))
    }.resume()
  }

  func urlSession(_ session: URLSession, task: URLSessionTask,
                  willPerformHTTPRedirection response: HTTPURLResponse,
                  newRequest request: URLRequest,
                  completionHandler: @escaping (URLRequest?) -> Void) {
    completionHandler(nil)
  }

  private func fail() {
    completion(.failure(NSError(domain: "BeautilyzeMemoryUpload", code: 1)))
  }
}

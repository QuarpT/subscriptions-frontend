package com.gu

import com.amazonaws.services.lambda.runtime.Context
import com.amazonaws.services.kms.AWSKMSClientBuilder
import com.amazonaws.services.kms.model.DecryptRequest
import java.nio.charset.Charset
import java.nio.ByteBuffer

import io.circe.generic.auto._
import io.circe.parser.decode
import io.github.yeghishe.lambda._
import okhttp3._
import net.liftweb.json._

case class EncryptedStateFunctionInput(data: List[Int])
case class User(identityId: String, scGuCookie: String)
case class UnsubscribeResult(status: String)
case class ListId(listId: String)
case class Subscriptions(subscriptions: List[ListId])

class MyHandler extends Handler[EncryptedStateFunctionInput, List[UnsubscribeResult]] {
  implicit val formats = DefaultFormats
  private val client = new OkHttpClient()

  private def unsubscribe(user: User, listId: String): Response = {
    val request = new Request.Builder()
      .url(s"https://idapi.theguardian.com/useremails/${user.identityId}/subscriptions")
      .addHeader("Cookie", s"SC_GU_U=${user.scGuCookie}")
      .addHeader("Referer", "https://theguardian.com")
      .delete(RequestBody.create(MediaType.parse("application/json"), s"""{"listId": "${listId}"}"""))
      .build()
    client.newCall(request).execute()
  }

  private def getAllSubscriptions(user: User): List[ListId] = {
    val request = new Request.Builder()
      .url(s"https://idapi.theguardian.com/useremails/${user.identityId}")
      .addHeader("Referer", "https://theguardian.com")
      .build()
    val response = client.newCall(request).execute()
    val responseBody = response.body().string
    parse(responseBody) \ "result" match {  // FIXME: use circe so lift-json can be removed
      case JNothing => throw new RuntimeException(s"Missing 'result' field: $responseBody")
      case resultField => resultField.extract[Subscriptions].subscriptions
    }
  }

  private def decryptInput(user: EncryptedStateFunctionInput) = {
    logger.info(user.toString)

    val byteArray = user.data.map(_.toByte)
    logger.info(byteArray.toArray[Byte].toString)

    val encryptedKey = ByteBuffer.wrap(byteArray.toArray[Byte])
    val client = AWSKMSClientBuilder.defaultClient
    val request = new DecryptRequest().withCiphertextBlob(encryptedKey)
    val plainTextKey = client.decrypt(request).getPlaintext
    val decryptedString = new String(plainTextKey.array(), Charset.forName("UTF-8"))
    decode[User](decryptedString)
  }

  def handler(user: EncryptedStateFunctionInput, context: Context): List[UnsubscribeResult] = {
    decryptInput(user).fold(
      error => List(UnsubscribeResult("200")), // for now we just ignore error

      creds => {
        val listOfIds = getAllSubscriptions(creds)
        logger.info(s"Un-subscribing from: ${listOfIds}")
        listOfIds.map { listId =>
          val response = unsubscribe(creds, listId.listId)
          parse(response.body().string).extract[UnsubscribeResult]
        }
      }
    )
  }
}

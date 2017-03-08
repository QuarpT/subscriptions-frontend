name := """unsubscribe-emails"""
organization := "com.gu"
version := "0.0.1"
scalaVersion := "2.12.1"
scalacOptions := Seq("-unchecked", "-feature", "-deprecation", "-encoding", "utf8")

resolvers += Resolver.jcenterRepo

libraryDependencies ++= {
  val ficusV     = "1.4.0"
  val scalaMockV = "3.4.2"

  Seq(
    "io.github.yeghishe" %% "scala-aws-lambda-utils"      % "0.0.3",
    "com.iheart"         %% "ficus"                       % ficusV,
    "com.amazonaws"      % "aws-lambda-java-events"       % "1.3.0",
    "org.scalamock"      %% "scalamock-scalatest-support" % scalaMockV % "it,test",
    "com.squareup.okhttp3" % "okhttp" % "3.6.0",
    "net.liftweb" %% "lift-json" % "3.1.0-M1"
  )
}

lazy val root = project.in(file(".")).configs(IntegrationTest)
Defaults.itSettings

initialCommands := """|import io.github.yeghishe._
                      |import io.github.yeghishe.lambda._
                      |import scala.concurrent._
                      |import scala.concurrent.duration._""".stripMargin

jarName in assembly := s"${name.value}.jar"
assemblyMergeStrategy in assembly := {
  case PathList("META-INF", xs @ _ *) => MergeStrategy.discard
  case _                              => MergeStrategy.first
}

import S3._
s3Settings
mappings in upload := Seq((file(s"target/scala-2.12/${name.value}.jar"), s"${name.value}.jar"))
host in upload := "identity-lambda.s3.amazonaws.com"
progress in upload := true
upload <<= upload dependsOn assembly
